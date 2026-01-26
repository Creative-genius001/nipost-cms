/* eslint-disable prettier/prettier */
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppLogger } from 'src/common/logger/logger.service';
import *  as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { jwtConstants } from './constants/constant';
import { LoginResponse, SignupResponse } from './interface/auth.interface';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { Member, MemberDocument } from 'src/config/database/schemas/member.schema';
import mongoose, { Model } from 'mongoose';
import { generateMemberId } from 'src/utils/generate-member-id';
import { randomInt } from 'crypto';
import { Account, AccountDocument } from 'src/config/database/schemas/account.schema';


@Injectable()
export class AuthService {

    constructor(
        @InjectModel(Member.name) private readonly memberModel: Model<MemberDocument>,
        @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
        private readonly logger: AppLogger,
        private readonly jwtService: JwtService,
        @InjectConnection()
        private readonly connection: mongoose.Connection,
    ){}

    async signup(memberData: SignupDto, userAgent: string, ipAddress: string): Promise<SignupResponse> {
        
         const phoneExists = await this.memberModel.findOne({ phone: memberData.phone });
                if (phoneExists) {
                throw new ConflictException('A member with this phone number already exists.');
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const hashedPassword = await bcrypt.hash(memberData.password, 12) as string;

            const memberId = generateMemberId(randomInt(9));

            const newMember = new this.memberModel({
                memberId,
                firstname: memberData.firstname,
                lastname: memberData.lastname,
                phone: memberData.phone,
                email: memberData.email,
                password: hashedPassword, 
                joinedAt: new Date(),
            });

            const newAccount = new this.accountModel({
                memberId: newMember._id,
                balance: 0,
            })

            const session = await this.connection.startSession();
            session.startTransaction();

            try {
                await newMember.save({ session });

                await newAccount.save({ session });

                await session.commitTransaction();
                
            } catch (error) {
                await session.abortTransaction();
                this.logger.error('Error during member signup transaction', error);
                throw new InternalServerErrorException('Signup failed. Please try again later.');
                
            }finally{
                await session.endSession();
            }

            await newMember.save();

            const {accessToken} = await this.generateTokens('member', newMember._id.toString(), newMember.memberId);

            this.logger.info('MEMBER_REGISTERED', {
                id: newMember._id.toString(),
                memberId: newMember.memberId,
                email: newMember.email,
                ip: ipAddress,
                userAgent,
                timestamp: new Date().toISOString(),
            })

            return {
                message: 'Signup successful',
                data: {
                    id: newMember._id.toString(),
                    memberId: newMember.memberId,
                    firstname: newMember.firstname,
                    lastname: newMember.lastname,
                    email: newMember.email,
                    role: newMember.role,
                    accessToken: accessToken,
                    account: {
                        id: newAccount._id.toString(),
                        balance: newAccount.balance,
                    }
                }
            };
    }

    async login(memberData: LoginDto, userAgent: string, ipAddress: string): Promise<LoginResponse> {

            const session = await this.connection.startSession();
            session.startTransaction();

            try {
                const member = await this.memberModel.findOne({ email: memberData.email }).session(session);
                if (!member) {
                throw new BadRequestException('Incorrect credentials');
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const matches = await bcrypt.compare(memberData.password, member.password);
            if (!matches){
                throw new BadRequestException('Incorrect credentials')
            };

            const account = await this.accountModel.findOne({ memberId: member._id }).session(session);
            if(!account){
                this.logger.error('Account for member not found during login', { memberId: member._id.toString() });
                throw new InternalServerErrorException('Internal Server Error');
            }

            const {accessToken} = await this.generateTokens(member.role , member._id.toString(), member.memberId);

            this.logger.info('MEMBER_LOGGEDIN', {
                id: member._id.toString(),
                memberId: member.memberId,
                email: member.email,
                ip: ipAddress,
                userAgent,
                timestamp: new Date().toISOString(),
            })

            await session.commitTransaction();

            return {
                message: 'Login successful',
                data: {
                    id: member._id.toString(),
                    memberId: member.memberId,
                    firstname: member.firstname,
                    lastname: member.lastname,
                    email: member.email,
                    role: member.role,
                    accessToken: accessToken,
                    account: {
                        id: account._id.toString(),
                        balance: account.balance,
                    }
                }
            };  

            
            } catch (error) {
                await session.abortTransaction();
                this.logger.error('Error during member login transaction', error);
                throw new InternalServerErrorException('Login failed. Please try again later.');
                
            } finally {
                await session.endSession();
            }
    }

    private async generateTokens(role: 'admin' | 'member', id: string, memberId: string): Promise<{ accessToken: string; }> {
        const payload = { sub: id, role, memberId };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: jwtConstants.access_token_secret,
            expiresIn: '15m',
        });

        return { accessToken };
    }
    
}


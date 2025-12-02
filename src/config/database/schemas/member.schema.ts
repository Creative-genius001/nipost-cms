// src/modules/members/schemas/member.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: true, collection: 'members' })
export class Member {
  @Prop({ unique: true })
  memberId: string;

  @Prop()
  firstname: string;

  @Prop()
  lastname: string;

  @Prop({ unique: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop()
  password: string;

  @Prop({ type: String, enum: ['member', 'admin'], default: 'member' })
  role: string;

  @Prop()
  joinedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

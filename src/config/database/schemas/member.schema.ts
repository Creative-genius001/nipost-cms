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

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'suspended';

  @Prop({ type: String, enum: ['member', 'admin'], default: 'member' })
  role: 'member' | 'admin';

  @Prop()
  joinedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

MemberSchema.index({ memberId: 1 });
MemberSchema.index({ status: 1 });
MemberSchema.index({ firstname: 1 });
MemberSchema.index({ lastname: 1 });
MemberSchema.index({ email: 1 });
MemberSchema.index({ joinedAt: 1 });

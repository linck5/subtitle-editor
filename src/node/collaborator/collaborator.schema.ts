import { Document, Schema } from 'mongoose';
import { User } from '../../user/user.schema'

export interface Collaborator extends Document {
  User_id: User;
  Creator: boolean;
  Admin: boolean;
  Banned: boolean;
}

export const CollaboratorSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: Boolean,
  admin: Boolean,
  banned: Boolean

}, {_id: false});

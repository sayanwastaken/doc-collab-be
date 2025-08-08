import { Schema, model } from 'mongoose';

const YjsDocSchema = new Schema({
  room: { type: String, required: true, unique: true },
  state: { type: Buffer, required: true },
});

export const YjsDoc = model('YjsDoc', YjsDocSchema);

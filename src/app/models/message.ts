export type MessageAttachmentType = 'image' | 'audio';

export interface MessageAttachment {
  type: MessageAttachmentType;
  url: string;
  publicId?: string;
  originalName?: string;
  name?: string;
  mimeType?: string;
  bytes?: number;
  size?: number;
  format?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    isOnline?: boolean;
  };
  senderRoleName: string;
  roomId: string;
  content: string;
  read: boolean;
  createdAt: string;
  type?: 'text' | 'image' | 'audio' | 'mixed';
  attachment?: MessageAttachment;
  attachments?: MessageAttachment[];
}

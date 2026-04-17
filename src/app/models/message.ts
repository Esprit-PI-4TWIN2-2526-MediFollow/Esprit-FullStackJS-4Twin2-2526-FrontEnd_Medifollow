export interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
      isOnline?: boolean;   // ← ajoute ce champ optionnel

  };
  senderRoleName: string;
  roomId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

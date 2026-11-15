export type Profile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
};

export type Comment = {
  id: string;
  user: Profile;
  content: string;
  createdAt: string; // ISO
  edited: boolean;
};

export type Post = {
  id: string;
  user: Profile;
  content: string;
  imageUrl: string | null; // null이면 텍스트 전용
  createdAt: string; // ISO
  edited: boolean;
  likes: number;
  liked: boolean;
  commentCount: number;
};

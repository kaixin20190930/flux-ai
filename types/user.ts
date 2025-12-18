// User type definition for 100% Cloudflare architecture
export interface User {
  userId: string;
  name: string;
  email: string;
  points: number;
  subscription_type: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
}

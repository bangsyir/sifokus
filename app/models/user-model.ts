export type OauthUser = {
  name: string;
  username: string;
  email: string;
  provider: string;
  providerId: string;
  avatarUrl: string;
};

export type GoogleIdTokenClaims = {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: bigint;
  exp: bigint;
};

export type AuthUser = {
  userId: string;
  isSignIn: boolean | undefined;
  username: string | null | undefined;
  email: string | null | undefined;
  avatarUrl: string | null | undefined;
};

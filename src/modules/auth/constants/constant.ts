/* eslint-disable prettier/prettier */

interface JwtConstants {
  access_token_secret: string;
}


export const jwtConstants:JwtConstants = {
  access_token_secret: process.env.JWT_ACCESS_TOKEN_SECRET,
};

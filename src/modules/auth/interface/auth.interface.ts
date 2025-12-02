/* eslint-disable prettier/prettier */
export interface SignupResponse {
    message: string,
    id: string,
    memberId: string,
    email: string,
    firstname: string,
    lastname: string,
    role: string,
    accessToken: string,
} 

export interface LoginResponse {
    message: string,
    id: string,
    memberId: string,
    email: string,
    firstname: string,
    lastname: string,
    role: string,
    accessToken: string,
}
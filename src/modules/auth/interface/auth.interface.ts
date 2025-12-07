/* eslint-disable prettier/prettier */
export interface SignupResponse {
    message: string,
    data: {
        id: string,
        memberId: string,
        email: string,
        firstname: string,
        lastname: string,
        role: string,
        accessToken: string,
        account: {
            id: string,
            balance: number
        }
    }
} 

export interface LoginResponse {
    message: string,
    data: {
        id: string,
        memberId: string,
        email: string,
        firstname: string,
        lastname: string,
        role: string,
        accessToken: string,
        account: {
            id: string,
            balance: number
        }
    }
}
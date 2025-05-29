import { getFirebaseToken } from "./getFirebaseToken"

export const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getFirebaseToken()

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    }
    return fetch(url, {...options,headers})
}
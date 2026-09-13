import bcrypt  from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;


// Mã hoá và giải mã  Bcrypts
export const bcryptHash = async (text: string): Promise<string> => {
    return bcrypt.hash(text, SALT_ROUNDS);
}

export const BcryptCompare = async (text: string, hashText: string): Promise<boolean> => {
    return bcrypt.compare(text,hashText);
}

// Mã hoá và giải mã SHA-256
export const hashSHA256 = (text: string): string => {
    return crypto.createHash("sha256").update(text).digest("hex");
}


export const generatedSessionId = (): string => {
    return crypto.randomUUID();
}
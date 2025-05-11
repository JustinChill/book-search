import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET_KEY || 'mysecretssshhhhhhh';
const expiration = '2h';

interface JwtPayload {
  data: {
    _id: string; // Changed from unknown to string
    username: string;
    email: string;
  };
}

import type { Request } from 'express';

export const authMiddleware = ({ req }: { req: Request }) => {
  // allows token to be sent via req.body, req.query, or headers
  let token = req.body?.token || req.query?.token || req.headers?.authorization;

  // ["Bearer", "<tokenvalue>"]
  if (req.headers?.authorization) {
    token = token?.split(' ').pop()?.trim();
  }

  if (!token) {
    return req;
  }

  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration }) as JwtPayload;
    return { ...req, user: data };
  } catch {
    console.log('Invalid token');
  }

  return req;
};

export const signToken = (username: string, email: string, _id: string) => { // Changed _id from unknown to string
  const payload = { username, email, _id };
  // Ensure JWT_SECRET_KEY is used, fallback to 'mysecretssshhhhhhh' consistent with secret variable
  const secretKey = process.env.JWT_SECRET_KEY || 'mysecretssshhhhhhh'; 

  return jwt.sign({ data: payload }, secretKey, { expiresIn: expiration }); // Use expiration consistent with authMiddleware
};

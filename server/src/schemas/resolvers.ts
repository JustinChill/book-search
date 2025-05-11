import { AuthenticationError } from 'apollo-server-express';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';
import { UserDocument } from '../models/User.js';
import { BookDocument } from '../models/Book.js';

// This reflects the user data structure stored in the JWT and attached to the context
interface AuthenticatedUser {
  _id: string;
  username: string;
  email: string;
  // Add other fields from JwtPayload.data if necessary, e.g., from signToken
}

interface Context {
  user?: AuthenticatedUser; // Updated to use the JWT user type
}

const resolvers = {
  Query: {
    me: async (_parent: undefined, _args: Record<string, never>, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('savedBooks');
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
  Mutation: {
    login: async (_parent: undefined, { email, password }: Record<string, string>): Promise<{ token: string; user: UserDocument | null }> => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }
      const token = signToken(user.username, user.email, user._id.toString());
      return { token, user };
    },
    addUser: async (_parent: undefined, { username, email, password }: Record<string, string>): Promise<{ token: string; user: UserDocument | null }> => {
      const user = await User.create({ username, email, password });
      const token = signToken(username, email, user._id.toString());
      return { token, user };
    },
    saveBook: async (_parent: undefined, { bookData }: { bookData: BookDocument }, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        ).populate('savedBooks');
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    removeBook: async (_parent: undefined, { bookId }: { bookId: string }, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate('savedBooks');
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

export default resolvers;

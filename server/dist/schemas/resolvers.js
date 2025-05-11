import { AuthenticationError } from 'apollo-server-express';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';
const resolvers = {
    Query: {
        me: async (_parent, _args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
    Mutation: {
        login: async (_parent, { email, password }) => {
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
        addUser: async (_parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(username, email, user._id.toString());
            return { token, user };
        },
        saveBook: async (_parent, { bookData }, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: bookData } }, { new: true, runValidators: true }).populate('savedBooks');
                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
        removeBook: async (_parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate({ _id: context.user._id }, { $pull: { savedBooks: { bookId } } }, { new: true }).populate('savedBooks');
                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
};
export default resolvers;

import User from '../models/User';

export const createUser = async (userData: any) => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (email: string, updateData: any) => {
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    return user;
  } catch (error) {
    throw error;
  }
};

export const updateUserLocation = async (email: string, location: any) => {
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { location, updatedAt: new Date() },
      { new: true }
    );
    return user;
  } catch (error) {
    throw error;
  }
}; 
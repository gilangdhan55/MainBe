import bcrypt from "bcryptjs";  

const encript = async (password: string): Promise<string> => {
  const saltRounds = 8;
  return await bcrypt.hash(password, saltRounds);
};

const compare = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export {encript, compare}
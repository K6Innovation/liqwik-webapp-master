import prisma from "../../utils/prisma-client";
import bcrypt from "bcrypt";
import CustomError from "../../utils/custom-error";
import  isAdmin  from "./is-admin";

const SALT_ROUNDS = 10;

export async function getUsers() {
  if (!(await isAdmin())) {
    throw new CustomError("Unauthorized", 401);
  }
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true,
      roles: {
        select: { role: { select: { name: true } } },
      },
    },
    orderBy: { username: "asc" },
  });
  return users.map((user) => ({
    ...user,
    roles: user.roles.map((role: any) => role.role.name),
  }));
}

export async function upsertRole(roleName: string) {
  return await prisma.role.upsert({
    where: { name: roleName },
    create: { name: roleName },
    update: { name: roleName },
  });
}

export async function createUserHelper({
  password,
  roles,
  ...data
}: {
  password: string;
  roles: string[];
  email: string;
  username: string;
}) {
  if (!(data.email && data.username && password)) {
    throw new CustomError("Name, email, and password are required", 400);
  }
  const exists = await prisma.user.findMany({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });
  if (exists.length) {
    throw new CustomError("Username and/or email already exists", 400);
  }
  const roleObjs: any[] = [];
  for await (const role of roles) {
    roleObjs.push(await upsertRole(role));
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      ...data,
      hashedPassword,
      roles: { create: roleObjs.map((role: any) => ({ roleId: role.id })) },
    },
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true,
      roles: {
        select: { role: { select: { name: true } } },
      },
    },
  });
  return {
    ...user,
    roles: user.roles.map((role: any) => role.role.name),
  };
}

export async function createUser(data: any) {
  if (!(await isAdmin())) {
    throw new CustomError("Unauthorized", 401);
  }
  try {
    return await createUserHelper(data);
  } catch (error: any) {
    throw error;
  }
}

export async function setUserIsActive(id: string, isActive: boolean) {
  if (!(await isAdmin())) {
    throw new CustomError("Unauthorized", 401);
  }
  return await prisma.user.update({
    where: { id },
    data: { isActive },
  });
}

export async function deleteUser(id: string) {
  if (!(await isAdmin())) {
    throw new CustomError("Unauthorized", 401);
  }
  return await prisma.user.delete({
    where: { id },
  });
}

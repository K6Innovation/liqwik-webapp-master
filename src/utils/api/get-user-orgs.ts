import prisma from "../prisma-client";

type Props = {
  userId: string;
  orgType: "buyer" | "seller";
};

export async function getSellerOrgs({ userId, orgType }: Props) {
  const userSellerRoles = await prisma.userRole.findMany({
    where: {
      AND: [
        {
          userId: {
            equals: userId,
          },
        },
        {
          role: {
            name: {
              equals: orgType,
            },
          },
        },
      ],
    },
  });
  return await prisma.assetSeller.findMany({
    where: {
      contactId: {
        in: userSellerRoles.map((role) => role.id),
      },
    },
  });
}

export async function getBuyerOrgs({ userId, orgType }: Props) {
  const userBuyerRoles = await prisma.userRole.findMany({
    where: {
      AND: [
        {
          userId: {
            equals: userId,
          },
        },
        {
          role: {
            name: {
              equals: orgType,
            },
          },
        },
      ],
    },
  });
  return await prisma.assetBuyer.findMany({
    where: {
      contactId: {
        in: userBuyerRoles.map((role) => role.id),
      },
    },
  });
}

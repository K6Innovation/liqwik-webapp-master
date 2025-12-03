import prisma from "../prisma-client";

type Props = {
  userId: string;
  orgType: "buyer" | "seller";
  userRoleId?: string; // Optional: filter by specific UserRole ID
};

export async function getSellerOrgs({ userId, orgType, userRoleId }: Props) {
  // Build the where clause
  const whereClause: any = {
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
  };

  // If userRoleId is provided, filter by that specific UserRole
  if (userRoleId) {
    whereClause.AND.push({
      id: {
        equals: userRoleId,
      },
    });
  }

  const userSellerRoles = await prisma.userRole.findMany({
    where: whereClause,
  });

  return await prisma.assetSeller.findMany({
    where: {
      contactId: {
        in: userSellerRoles.map((role) => role.id),
      },
    },
  });
}

export async function getBuyerOrgs({ userId, orgType, userRoleId }: Props) {
  // Build the where clause
  const whereClause: any = {
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
  };

  // If userRoleId is provided, filter by that specific UserRole
  if (userRoleId) {
    whereClause.AND.push({
      id: {
        equals: userRoleId,
      },
    });
  }

  const userBuyerRoles = await prisma.userRole.findMany({
    where: whereClause,
  });

  return await prisma.assetBuyer.findMany({
    where: {
      contactId: {
        in: userBuyerRoles.map((role) => role.id),
      },
    },
  });
}

// New helper function to get organization by UserRole ID
export async function getOrgByUserRoleId(userRoleId: string, orgType: "buyer" | "seller") {
  if (orgType === "seller") {
    return await prisma.assetSeller.findUnique({
      where: {
        contactId: userRoleId,
      },
    });
  } else {
    return await prisma.assetBuyer.findUnique({
      where: {
        contactId: userRoleId,
      },
    });
  }
}
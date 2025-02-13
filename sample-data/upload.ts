import fs from "fs";
import { parse, stringify } from "yaml";
import prisma from "../src/utils/prisma-client";
import bcrypt from "bcrypt";
import dayjs from "dayjs";

(async () => {
  const files = ["roles", "users", "orgs", "assets", "bids"];
  const [roles, users, orgs, assets, bids] = await Promise.all(
    files.map((file) => {
      return fs.promises
        .readFile(`sample-data/${file}.yml`, "utf8")
        .then((data) => parse(data));
    })
  );
  console.log(roles);
  console.log(users);
  console.log(orgs);
  console.log(assets);
  console.log(bids);

  // await prisma.assetBid.deleteMany();
  // await prisma.asset.deleteMany();
  // await prisma.assetSeller.deleteMany();
  // await prisma.assetBuyer.deleteMany();
  // await prisma.billToParty.deleteMany();
  // await prisma.userRole.deleteMany();
  // await prisma.role.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.assetBid.deleteMany();

  await prisma.role.createManyAndReturn({
    data: roles,
  });
  await prisma.user.createManyAndReturn({
    data: users.map(({ roles, ...user }: any) => {
      return {
        ...user,
        email: `${user.username}@example.com`,
        hashedPassword: bcrypt.hashSync("pwd", 10),
      };
    }),
  });
  await prisma.userRole.createManyAndReturn({
    data: users
      .map(({ roles: userRoles, ...user }: any) => {
        return userRoles.map((role: any) => {
          return {
            userId: user.id,
            roleId: roles.find(({ name }: any) => name === role).id,
          };
        });
      })
      .flat(),
  });
  console.log("Creating sellers");
  const sellersData = await Promise.all(
    orgs
      .filter(({ type }: any) => type === "seller")
      .map(async ({ type, contact: contactRoleId, ...org }: any) => {
        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: contactRoleId,
            },
          },
          select: {
            id: true,
          },
        });
        if (!user) {
          throw new Error(`User ${org.contact} not found`);
        }
        const contact = await prisma.userRole.findFirst({
          where: {
            userId: {
              equals: user.id,
            },
          },
          select: {
            id: true,
          },
        });
        if (!contact) {
          throw new Error(`Contact ${org.contact} not found`);
        }
        return {
          ...org,
          contactId: contact.id,
        };
      })
  );
  const sellers = await prisma.assetSeller.createManyAndReturn({
    data: sellersData,
  });
  // console.log(JSON.stringify(sellers, null, 2));

  const buyersData = await Promise.all(
    orgs
      .filter(({ type }: any) => type === "buyer")
      .map(async ({ type, contact: contactRoleId, ...org }: any) => {
        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: contactRoleId,
            },
          },
          select: {
            id: true,
          },
        });
        if (!user) {
          throw new Error(`User ${org.contact} not found`);
        }
        const contact = await prisma.userRole.findFirst({
          where: {
            userId: {
              equals: user.id,
            },
          },
          select: {
            id: true,
          },
        });
        if (!contact) {
          throw new Error(`Contact ${org.contact} not found`);
        }
        return {
          ...org,
          contactId: contact.id,
        };
      })
  );
  const buyers = await prisma.assetBuyer.createManyAndReturn({
    data: buyersData,
  });
  // console.log(JSON.stringify(buyers, null, 2));

  const billToPartiesData = await Promise.all(
    orgs
      .filter(({ type }: any) => type === "billToParty")
      .map(async ({ type, contact: contactRoleId, ...org }: any) => {
        const user = await prisma.user.findFirst({
          where: {
            username: {
              equals: contactRoleId,
            },
          },
          select: {
            id: true,
          },
        });
        if (!user) {
          throw new Error(`User ${org.contact} not found`);
        }
        const contact = await prisma.userRole.findFirst({
          where: {
            userId: {
              equals: user.id,
            },
          },
          select: {
            id: true,
          },
        });
        if (!contact) {
          throw new Error(`Contact ${org.contact} not found`);
        }
        return {
          ...org,
          contactId: contact.id,
        };
      })
  );
  const billToParties = await prisma.billToParty.createManyAndReturn({
    data: billToPartiesData,
  });
  // console.log(JSON.stringify(billToParties, null, 2));

  const assetsData = await Promise.all(
    assets.map(
      async ({
        seller: sellerId,
        buyer: buyerId,
        billToParty: billToPartyId,
        termMonths,
        ...asset
      }: any) => {
        const seller = await prisma.assetSeller.findFirst({
          where: {
            id: {
              equals: sellerId,
            },
          },
          select: {
            id: true,
          },
        });
        if (!seller) {
          throw new Error(`Seller ${sellerId} not found`);
        }
        const billToParty = await prisma.billToParty.findFirst({
          where: {
            id: {
              equals: billToPartyId,
            },
          },
          select: {
            id: true,
          },
        });
        if (!billToParty) {
          throw new Error(`Bill to party ${billToPartyId} not found`);
        }
        return {
          ...asset,
          sellerId: seller.id,
          billToPartyId: billToParty.id,
          invoiceDate: dayjs().toDate(),
          paymentDate: dayjs().add(termMonths, "months").toDate(),
          termMonths
          // bidClosingDate: dayjs().add(30, "day").toDate(),
        };
      }
    )
  );
  const assetItems = await prisma.asset.createManyAndReturn({
    data: assetsData,
  });
  // console.log("Assets", assetItems);

  const bidsData = await Promise.all(
    bids.map(async ({ asset: assetId, buyer: buyerId, ...bid }: any, i: number) => {
      const asset = await prisma.asset.findFirst({
        where: {
          id: {
            equals: assetId,
          },
        },
        select: {
          id: true,
        },
      });
      if (!asset) {
        throw new Error(`Asset ${assetId} not found`);
      }
      const buyer = await prisma.assetBuyer.findFirst({
        where: {
          id: {
            equals: buyerId,
          },
        },
        select: {
          id: true,
        },
      });
      if (!buyer) {
        throw new Error(`Buyer ${buyerId} not found`);
      }
      return {
        ...bid,
        assetId: asset.id,
        buyerId: buyer.id,
        createdAt: dayjs().add(i, 'second').toDate(),
        updatedAt: dayjs().add(i, 'second').toDate(),
      };
    })
  );
  const bidItems = await prisma.assetBid.createManyAndReturn({
    data: bidsData,
  });
  console.log("Bids", bidItems);
})().catch((error) => {
  console.log(error);
});

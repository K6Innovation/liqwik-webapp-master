import { createUserHelper } from "./index";

// npx ts-node --project tsconfig.server.json src/utils/users/create-seller.ts <username> <email> <password> <confirmPassword>

(async () => {
  const username = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];
  const confirmPassword = process.argv[5];

  if (!(username && email && password && confirmPassword)) {
    console.error("Name, email, password and confirmPassword are required");
    process.exit(1);
  }
  if (password !== confirmPassword) {
    console.error("Passwords do not match");
    process.exit(1);
  }
  try {
    const user = await createUserHelper({
      username,
      email,
      password,
      roles: ["seller"],
    });
    console.log("User created", user);
    process.exit(0);
  } catch (error: any) {
    console.error(error);
    process.exit(1);
  }
})();

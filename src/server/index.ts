// Adapted from https://stackblitz.com/edit/github-oqhe9b?file=package.json
import { createServer } from "http";
import { parse } from "url";
import next from "next";

const options =
  process.env.NODE_ENV === "production"
    ? {
        dev: false,
        hostname: "0.0.0.0",
        port: process.env.PORT ? parseInt(process.env.PORT) : 80,
      }
    : { dev: true, hostname: "localhost", port: 3000 };
const app = next(options);
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(options.port);

  // tslint:disable-next-line:no-console
  console.log(
    `> Server listening at http://${options.hostname}:${options.port} as ${
      options.dev ? "development" : process.env.NODE_ENV
    }`
  );
});

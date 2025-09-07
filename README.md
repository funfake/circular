# Next.js, WorkOS, Convex, Shadcn/ui starter kit

This is a starter kit already configured to start working on your side project 🚀

## Guides
- Next.js starter guide: https://nextjs.org/docs/app/getting-started/installation
- Convex + WorkOS guide: https://docs.convex.dev/auth/authkit
- Shacn/ui with Next.js https://ui.shadcn.com/docs/installation/next

## Start the development server
Start with `yarn install` (to install package) and then run the development server `yarn dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Start Convex
Run the commant `npx convex dev` (after having configured the project, see below).

# Configuration
## WorkOS config
Setup AuthKit (https://dashboard.workos.com/environment/authentication)

Then follow these steps:
1. Add `Work OS Client Id` to the JWT token (see Convex + WorkOS tutorial) https://dashboard.workos.com/environment/authentication/edit-jwt-template
2. Set the CORS config (https://dashboard.workos.com/environment/authentication/sessions) to the development url `https://localhost:3000` 
3. Set the homepage url (https://dashboard.workos.com/redirects) to `https://localhost:3000`
4. Set the redirect url (https://dashboard.workos.com/redirects) to `https://localhost:3000/callback`

## Environment Config
Create a `.env.local` file at the root of the project.

### Create a session password for WorkOS
The SDK requires you to set a strong password to encrypt cookies. This password must be 32 characters long. You can generate a secure password by using the 1Password generator or the openssl library via the command line:
`openssl rand -base64 32`

### Add variables to `.env.local`
`WORKOS_CLIENT_ID`: From WorkOS (https://dashboard.workos.com/api-keys)
`WORKOS_API_KEY`: From WorkOS (https://dashboard.workos.com/api-keys)
`WORKOS_COOKIE_PASSWORD`: Add the generated session password string in its entirety (with =)

## Convex config
Set `WORKOS_CLIENT_ID` in Convex (project settings page)

## Fonts
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deploy on Vercel
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

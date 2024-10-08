import { execSync } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

async function setup() {
  try {
    // Read the existing package.json
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"))

    // Get the app name (basename of the current directory)
    const appName = path.basename(process.cwd())

    // Update package.json
    packageJson.name = appName
    packageJson.version = "0.1.0"

    // Write the updated package.json
    await fs.writeFile("package.json", JSON.stringify(packageJson, null, 2))

    // Update deployment.json
    let deploymentConfig = {}
    try {
      const existingConfig = await fs.readFile("deployment.json", "utf8")
      deploymentConfig = JSON.parse(existingConfig)
    } catch (error) {
      // File doesn't exist or is invalid JSON, use empty object
    }
    deploymentConfig.appName = appName
    await fs.writeFile(
      "deployment.json",
      JSON.stringify(deploymentConfig, null, 2)
    )

    // Initialize git repository
    execSync("git init")
    execSync(
      "git remote add boilerplate https://github.com/EugenEistrach/perfux-boilerplate.git"
    )
    execSync("git add .")
    execSync('git commit -m "Initial commit from boilerplate"')

    // Set up environment variables
    await fs.copyFile(".env.example", ".env")
    const envContent = await fs.readFile(".env", "utf8")
    const updatedEnvContent = envContent.replace(
      /^AUTH_SECRET=.*/m,
      `AUTH_SECRET=${crypto.randomBytes(33).toString("base64")}`
    )
    await fs.writeFile(".env", updatedEnvContent)

    // Install dependencies
    console.log("Installing dependencies...")
    execSync("pnpm install", { stdio: "inherit" })

    // Initialize the database
    console.log("Initializing the database...")
    execSync("pnpm run db:reset", { stdio: "inherit" })

    console.log("Project setup completed successfully!")
    console.log(
      "\nThe deployment.json file has been updated with the appName configuration."
    )
    console.log(
      "\nIMPORTANT: Please manually set up your GitHub and Discord OAuth apps and update the following variables in .env:"
    )
    console.log("- AUTH_GITHUB_ID: Your GitHub App's Client ID")
    console.log("- AUTH_GITHUB_SECRET: Your GitHub App's Client Secret")
    console.log("- AUTH_DISCORD_ID: Your Discord App's Client ID")
    console.log("- AUTH_DISCORD_SECRET: Your Discord App's Client Secret")

    console.log("Run pnpm setup-deployment to setup production deployment")
  } catch (error) {
    console.error("An error occurred during setup:", error)
  }
}

setup()

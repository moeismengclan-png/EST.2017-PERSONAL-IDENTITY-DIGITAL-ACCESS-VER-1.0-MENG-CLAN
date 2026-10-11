# Moshi Moshi 2.0

This is a private npm package published on GitHub Packages.

## Installation

To install this package, you need to authenticate with GitHub Packages.

### 1. Create a Personal Access Token (PAT)

Go to https://github.com/settings/tokens and create a new token with these scopes:
- `read:packages` - to install packages
- `write:packages` - to publish packages (optional for installation only)

### 2. Configure npm

Create or update your `.npmrc` file in your home directory (`~/.npmrc`):

```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
@moeismengclan-png:registry=https://npm.pkg.github.com
```

Replace `YOUR_GITHUB_TOKEN` with your Personal Access Token.

### 3. Install the package

```bash
npm install @moeismengclan-png/moshi-moshi-2.0
```

## Publishing

### Local Publishing

1. Make sure you're authenticated:
   ```bash
   npm login --registry=https://npm.pkg.github.com --scope=@moeismengclan-png
   ```

2. Update the version in `package.json`

3. Publish the package:
   ```bash
   npm publish
   ```

### Automatic Publishing with GitHub Actions

This repository includes an automatic publishing workflow (`.github/workflows/npm-publish.yml`) that:
- Triggers when you push a git tag starting with `v` (e.g., `v1.0.0`)
- Automatically publishes to GitHub Packages

To use it:

1. Update the version in `package.json`
2. Create a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will automatically publish the package

## License

Apache License 2.0

# Customer App Deployment Guide

## Deployment Architecture

The **customer-app** is deployed as a **static Next.js application** to **AWS S3 + CloudFront**, NOT Lambda.

### Architecture Overview

- **Frontend (customer-app)**: S3 + CloudFront (static hosting)
- **Backend (database-service)**: Lambda + API Gateway (serverless API)

**Important:** Lambda is only used for the database-service backend API. The customer-app frontend is a static site hosted on S3 and served via CloudFront CDN.

## Prerequisites

1. AWS Account with appropriate permissions
2. GitHub repository with secrets configured:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `API_URL` (database service API Gateway URL)
   - `NEXT_PUBLIC_API_URL` (for build-time environment variables)
   - `NEXT_PUBLIC_APP_URL` (for build-time environment variables)

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

The repository includes two GitHub Actions workflows:

#### 1. CI/CD Pipeline (`ci-cd.yml`)
- Runs on: push to `main`/`develop` branches, pull requests
- **Runs tests before building**
- Builds and deploys to S3
- Does NOT deploy infrastructure (manual Terraform required)

#### 2. Full Deploy (`deploy.yml`)
- Runs on: push to `main` branch or manual trigger
- **Runs tests before deploying**
- Deploys infrastructure with Terraform
- Builds and deploys application to S3 + CloudFront

**To deploy:**

1. Push to `main` branch (automatic)
2. Or manually trigger via GitHub Actions UI:
   - Go to Actions → Deploy workflow
   - Click "Run workflow"
   - Select environment (dev/staging/prod)

### Method 2: Manual Deployment

#### Step 1: Configure Environment Variables

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/api
NEXT_PUBLIC_APP_URL=https://your-cloudfront-url.cloudfront.net
```

#### Step 2: Build Static Export

```bash
npm install
npm run build
```

This creates an `out/` directory with static files (Next.js static export).

#### Step 3: Deploy Infrastructure (First Time)

```bash
cd terraform
terraform init
terraform plan -var="environment=dev" -var="api_url=$API_URL"
terraform apply
```

#### Step 4: Deploy to S3

```bash
# Get bucket name from Terraform output
BUCKET_NAME=$(terraform output -raw s3_bucket_name)

# Sync static files to S3
aws s3 sync out/ s3://$BUCKET_NAME/ --delete
```

#### Step 5: Invalidate CloudFront Cache

```bash
# Get CloudFront distribution ID from Terraform output
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Testing Before Deployment

**Critical:** Always run tests before deploying:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint
```

The GitHub Actions workflows automatically run these checks before deployment.

## Environment Configuration

### Build-Time Environment Variables

These are baked into the static build:

- `NEXT_PUBLIC_API_URL` - Database service API endpoint
- `NEXT_PUBLIC_APP_URL` - Customer app URL (for redirects)

### Runtime Configuration

Since this is a static export, all configuration must be set at build time. Environment variables are replaced during the build process.

## Terraform Configuration

The `terraform/` directory contains infrastructure as code:

- **S3 Bucket** - Static file hosting
- **CloudFront Distribution** - CDN for global distribution
- **IAM Roles** - For deployment permissions

### Terraform Variables

See `terraform/terraform.tfvars.example` for required variables:

- `environment` - Deployment environment (dev/staging/prod)
- `api_url` - Database service API Gateway URL
- `aws_region` - AWS region (default: us-east-1)
- `project_name` - Project name prefix

## Troubleshooting

### Build Fails

1. Check environment variables are set
2. Verify `next.config.js` has `output: 'export'`
3. Check for TypeScript errors: `npm run type-check`

### Tests Fail in CI/CD

1. Verify `jest.setup.js` exists
2. Check test environment variables
3. Review test output in GitHub Actions logs

### Deployment Fails

1. Verify AWS credentials are configured
2. Check S3 bucket exists and is accessible
3. Verify CloudFront distribution ID is correct
4. Check Terraform outputs are available

### Static Files Not Updating

1. Invalidate CloudFront cache
2. Check S3 bucket sync completed
3. Verify file paths are correct

## Cost Optimization

- **S3**: ~$0.023 per GB storage, $0.005 per 1,000 requests
- **CloudFront**: ~$0.085 per GB data transfer (first 10TB)
- **Estimated monthly cost**: $1-5 for low traffic lab usage

## Security Notes

⚠️ **This is a lab environment with intentional vulnerabilities:**

- Static files are publicly accessible
- No authentication on S3 bucket (intentional)
- CORS is permissive (intentional vulnerability)
- Environment variables are exposed in build (intentional)

For production, implement:
- Private S3 bucket with CloudFront OAI
- WAF rules on CloudFront
- Proper CORS configuration
- Environment variable encryption

## References

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Distribution](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)


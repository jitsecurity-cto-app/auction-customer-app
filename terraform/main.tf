terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "jit-auction-lab-terraform-state"
    key            = "customer-app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "jit-auction-lab-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Vulnerable-Auction-Lab"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Service     = "customer-app"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}

# S3 Bucket for static hosting
resource "aws_s3_bucket" "customer_app" {
  bucket = "${var.project_name}-customer-app-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-customer-app-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "customer_app" {
  bucket = aws_s3_bucket.customer_app.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "customer_app" {
  bucket = aws_s3_bucket.customer_app.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "customer_app" {
  bucket = aws_s3_bucket.customer_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.customer_app.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.customer_app]
}

resource "aws_s3_bucket_website_configuration" "customer_app" {
  bucket = aws_s3_bucket.customer_app.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_cors_configuration" "customer_app" {
  bucket = aws_s3_bucket.customer_app.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# CloudFront Distribution
# Note: Using S3 website endpoint directly for simplicity (lab setup)
# OAI removed - not needed for simple lab configuration
resource "aws_cloudfront_distribution" "customer_app" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "CloudFront distribution for customer-app ${var.environment}"

  aliases = var.domain_name != "" ? [var.domain_name] : []

  origin {
    domain_name = aws_s3_bucket_website_configuration.customer_app.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.customer_app.bucket}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.customer_app.bucket}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.customer_app.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == ""
  }

  tags = {
    Name = "${var.project_name}-customer-app-${var.environment}"
  }
}

# Outputs
output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.customer_app.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.customer_app.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.customer_app.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.customer_app.domain_name
}

output "website_url" {
  description = "Website URL"
  value       = "https://${aws_cloudfront_distribution.customer_app.domain_name}"
}

output "s3_website_endpoint" {
  description = "S3 website endpoint"
  value       = aws_s3_bucket_website_configuration.customer_app.website_endpoint
}


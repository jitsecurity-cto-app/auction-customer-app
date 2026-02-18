variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "auction-lab"
}

variable "domain_name" {
  description = "Custom domain name for CloudFront (optional)"
  type        = string
  default     = ""
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone name (e.g., auctionspulse.com)"
  type        = string
  default     = "auctionspulse.com"
}

variable "api_url" {
  description = "API URL for the database service"
  type        = string
  default     = ""
}


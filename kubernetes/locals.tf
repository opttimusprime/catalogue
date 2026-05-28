locals {
  common_tags = {
    Project     = "roboshop"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
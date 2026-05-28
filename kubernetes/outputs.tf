output "catalogue_helm_release_name" {
  value = helm_release.catalogue.name
}

output "catalogue_namespace" {
  value = helm_release.catalogue.namespace
}
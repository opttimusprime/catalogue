resource "kubernetes_namespace" "catalogue" {
  metadata {
    name = var.namespace

    labels = {
      app         = "catalogue"
      environment = var.environment
    }
  }
}

resource "helm_release" "catalogue" {
  name      = "catalogue"
  chart     = "../helm"
  namespace = kubernetes_namespace.catalogue.metadata[0].name

  values = [
    file("../helm/values.yaml"),
    file(var.helm_values_file)
  ]

  depends_on = [
    kubernetes_namespace.catalogue
  ]
}
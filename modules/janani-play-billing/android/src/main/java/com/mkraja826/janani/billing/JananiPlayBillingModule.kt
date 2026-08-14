package com.mkraja826.janani.billing

import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class JananiPlayBillingModule : Module(), PurchasesUpdatedListener {
  private var billingClient: BillingClient? = null
  private val productDetailsById = mutableMapOf<String, ProductDetails>()

  override fun definition() = ModuleDefinition {
    Name("JananiPlayBilling")
    Events("onPurchaseUpdated")

    AsyncFunction("connect") { promise: Promise ->
      val client = ensureClient()
      if (client.isReady) {
        promise.resolve(true)
        return@AsyncFunction
      }

      client.startConnection(object : BillingClientStateListener {
        override fun onBillingSetupFinished(result: BillingResult) {
          if (result.responseCode == BillingClient.BillingResponseCode.OK) {
            promise.resolve(true)
          } else {
            promise.reject("E_BILLING_SETUP", result.debugMessage, null)
          }
        }

        override fun onBillingServiceDisconnected() {
          // The JS layer reconnects before the next billing operation.
        }
      })
    }

    AsyncFunction("disconnect") {
      billingClient?.endConnection()
      billingClient = null
      productDetailsById.clear()
      true
    }

    AsyncFunction("querySubscriptions") { productIds: List<String>, promise: Promise ->
      val client = billingClient
      if (client == null || !client.isReady) {
        promise.reject("E_BILLING_NOT_READY", "Google Play Billing is not connected.", null)
        return@AsyncFunction
      }

      val products = productIds.distinct().take(10).map { productId ->
        QueryProductDetailsParams.Product.newBuilder()
          .setProductId(productId)
          .setProductType(BillingClient.ProductType.SUBS)
          .build()
      }
      val params = QueryProductDetailsParams.newBuilder().setProductList(products).build()

      client.queryProductDetailsAsync(params) { result, queryResult ->
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
          promise.reject("E_QUERY_PRODUCTS", result.debugMessage, null)
          return@queryProductDetailsAsync
        }

        val output = queryResult.productDetailsList.map { details ->
          productDetailsById[details.productId] = details
          val offer = details.subscriptionOfferDetails?.firstOrNull()
          val phase = offer?.pricingPhases?.pricingPhaseList?.lastOrNull()
          mapOf(
            "productId" to details.productId,
            "name" to details.name,
            "title" to details.title,
            "description" to details.description,
            "offerToken" to offer?.offerToken,
            "basePlanId" to offer?.basePlanId,
            "formattedPrice" to phase?.formattedPrice,
            "priceAmountMicros" to phase?.priceAmountMicros,
            "priceCurrencyCode" to phase?.priceCurrencyCode,
            "billingPeriod" to phase?.billingPeriod,
          )
        }
        promise.resolve(output)
      }
    }

    AsyncFunction("purchaseSubscription") { productId: String, promise: Promise ->
      val client = billingClient
      if (client == null || !client.isReady) {
        promise.reject("E_BILLING_NOT_READY", "Google Play Billing is not connected.", null)
        return@AsyncFunction
      }
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("E_NO_ACTIVITY", "Janani must be in the foreground to start a purchase.", null)
        return@AsyncFunction
      }
      val details = productDetailsById[productId]
      if (details == null) {
        promise.reject("E_PRODUCT_NOT_LOADED", "Reload Care+ plans before purchasing.", null)
        return@AsyncFunction
      }
      val offerToken = details.subscriptionOfferDetails?.firstOrNull()?.offerToken
      if (offerToken.isNullOrBlank()) {
        promise.reject("E_OFFER_UNAVAILABLE", "No eligible Google Play subscription offer is available.", null)
        return@AsyncFunction
      }

      val productParams = BillingFlowParams.ProductDetailsParams.newBuilder()
        .setProductDetails(details)
        .setOfferToken(offerToken)
        .build()
      val flowParams = BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(listOf(productParams))
        .build()
      val result = client.launchBillingFlow(activity, flowParams)
      if (result.responseCode == BillingClient.BillingResponseCode.OK) {
        promise.resolve(true)
      } else {
        promise.reject("E_PURCHASE_LAUNCH", result.debugMessage, null)
      }
    }

    AsyncFunction("restoreSubscriptions") { promise: Promise ->
      val client = billingClient
      if (client == null || !client.isReady) {
        promise.reject("E_BILLING_NOT_READY", "Google Play Billing is not connected.", null)
        return@AsyncFunction
      }
      val params = QueryPurchasesParams.newBuilder()
        .setProductType(BillingClient.ProductType.SUBS)
        .build()
      client.queryPurchasesAsync(params) { result, purchases ->
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
          promise.reject("E_RESTORE_PURCHASES", result.debugMessage, null)
          return@queryPurchasesAsync
        }
        promise.resolve(purchases.map(::purchaseToMap))
      }
    }
  }

  private fun ensureClient(): BillingClient {
    billingClient?.let { return it }
    val context = appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("React context is unavailable")
    val pendingParams = PendingPurchasesParams.newBuilder()
      .enableOneTimeProducts()
      .build()
    return BillingClient.newBuilder(context)
      .setListener(this)
      .enablePendingPurchases(pendingParams)
      .build()
      .also { billingClient = it }
  }

  override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
    val payload = mapOf(
      "responseCode" to result.responseCode,
      "debugMessage" to result.debugMessage,
      "purchases" to (purchases?.map(::purchaseToMap) ?: emptyList<Map<String, Any?>>()),
    )
    sendEvent("onPurchaseUpdated", payload)
  }

  private fun purchaseToMap(purchase: Purchase): Map<String, Any?> {
    val state = when (purchase.purchaseState) {
      Purchase.PurchaseState.PURCHASED -> "purchased"
      Purchase.PurchaseState.PENDING -> "pending"
      else -> "unspecified"
    }
    return mapOf(
      "purchaseToken" to purchase.purchaseToken,
      "products" to purchase.products,
      "purchaseState" to state,
      "acknowledged" to purchase.isAcknowledged,
      "purchaseTime" to purchase.purchaseTime,
      "autoRenewing" to purchase.isAutoRenewing,
    )
  }
}

const { withAndroidManifest, withAppBuildGradle, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.mkraja826.janani';

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

module.exports = function withJananiPlayBilling(config) {
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    const permission = 'com.android.vending.BILLING';
    if (!manifest['uses-permission'].some((item) => item.$?.['android:name'] === permission)) {
      manifest['uses-permission'].push({ $: { 'android:name': permission } });
    }
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const dependency = 'implementation "com.android.billingclient:billing:9.1.0"';
    if (!contents.includes('com.android.billingclient:billing')) {
      contents = contents.replace(/dependencies\s*\{/, (match) => `${match}\n    ${dependency}`);
    }
    mod.modResults.contents = contents;
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('import com.mkraja826.janani.JananiPlayBillingPackage')) {
      const packageLine = contents.match(/^package .*$/m)?.[0];
      if (packageLine) contents = contents.replace(packageLine, `${packageLine}\n\nimport com.mkraja826.janani.JananiPlayBillingPackage`);
    }
    if (!/^\s*(?:packages\.)?add\(JananiPlayBillingPackage\(\)\)\s*$/m.test(contents)) {
      const sdk54 = /^(\s*)PackageList\(this\)\.packages\.apply\s*\{/m;
      const legacy = /^(\s*)val packages = PackageList\(this\)\.packages\s*$/m;
      if (sdk54.test(contents)) contents = contents.replace(sdk54, (m, i) => `${m}\n${i}  add(JananiPlayBillingPackage())`);
      else if (legacy.test(contents)) contents = contents.replace(legacy, (m, i) => `${m}\n${i}packages.add(JananiPlayBillingPackage())`);
      else throw new Error('Play Billing package registration failed: unsupported Android MainApplication template.');
    }
    mod.modResults.contents = contents;
    return mod;
  });

  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.platformProjectRoot;
    const javaRoot = path.join(root, 'app/src/main/java/com/mkraja826/janani');

    write(path.join(javaRoot, 'JananiPlayBillingPackage.kt'), `package ${PACKAGE}\n\nimport com.facebook.react.ReactPackage\nimport com.facebook.react.bridge.NativeModule\nimport com.facebook.react.bridge.ReactApplicationContext\nimport com.facebook.react.uimanager.ViewManager\n\nclass JananiPlayBillingPackage : ReactPackage {\n  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(JananiPlayBillingModule(reactContext))\n  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()\n}\n`);

    write(path.join(javaRoot, 'JananiPlayBillingModule.kt'), `package ${PACKAGE}\n\nimport com.android.billingclient.api.*\nimport com.facebook.react.bridge.*\n\nclass JananiPlayBillingModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {\n  private var billingClient: BillingClient? = null\n  private var connectPromise: Promise? = null\n  private var purchasePromise: Promise? = null\n\n  override fun getName() = \"JananiPlayBilling\"\n\n  private fun client(): BillingClient {\n    val existing = billingClient\n    if (existing != null) return existing\n    return BillingClient.newBuilder(reactContext)\n      .setListener(this)\n      .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())\n      .enableAutoServiceReconnection()\n      .build()\n      .also { billingClient = it }\n  }\n\n  @ReactMethod fun connect(promise: Promise) {\n    val c = client()\n    if (c.isReady) { promise.resolve(true); return }\n    if (connectPromise != null) { promise.reject(\"BILLING_CONNECT_ACTIVE\", \"Billing connection is already starting.\"); return }\n    connectPromise = promise\n    c.startConnection(object : BillingClientStateListener {\n      override fun onBillingSetupFinished(result: BillingResult) {\n        val p = connectPromise ?: return\n        connectPromise = null\n        if (result.responseCode == BillingClient.BillingResponseCode.OK) p.resolve(true)\n        else p.reject(\"BILLING_SETUP_\${result.responseCode}\", result.debugMessage)\n      }\n      override fun onBillingServiceDisconnected() = Unit\n    })\n  }\n\n  @ReactMethod fun disconnect() { billingClient?.endConnection(); billingClient = null }\n\n  @ReactMethod fun queryProducts(productIds: ReadableArray, productType: String, promise: Promise) {\n    val c = client()\n    if (!c.isReady) { promise.reject(\"BILLING_NOT_READY\", \"Google Play Billing is not connected.\"); return }\n    val type = if (productType == \"subs\") BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP\n    val products = (0 until productIds.size()).mapNotNull { index -> productIds.getString(index)?.let { id -> QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(type).build() } }\n    val params = QueryProductDetailsParams.newBuilder().setProductList(products).build()\n    c.queryProductDetailsAsync(params) { result, detailsResult ->\n      if (result.responseCode != BillingClient.BillingResponseCode.OK) { promise.reject(\"BILLING_QUERY_\${result.responseCode}\", result.debugMessage); return@queryProductDetailsAsync }\n      val array = Arguments.createArray()\n      detailsResult.productDetailsList.forEach { details ->\n        val map = Arguments.createMap()\n        map.putString(\"productId\", details.productId)\n        map.putString(\"name\", details.name)\n        map.putString(\"description\", details.description)\n        map.putString(\"productType\", details.productType)\n        val oneTime = details.oneTimePurchaseOfferDetailsList?.firstOrNull()\n        if (oneTime != null) { map.putString(\"formattedPrice\", oneTime.formattedPrice); map.putString(\"priceCurrencyCode\", oneTime.priceCurrencyCode) }\n        val offers = Arguments.createArray()\n        details.subscriptionOfferDetails?.forEach { offer ->\n          val offerMap = Arguments.createMap()\n          offerMap.putString(\"offerToken\", offer.offerToken)\n          offerMap.putString(\"basePlanId\", offer.basePlanId)\n          offerMap.putString(\"offerId\", offer.offerId)\n          val phases = Arguments.createArray()\n          offer.pricingPhases.pricingPhaseList.forEach { phase ->\n            val phaseMap = Arguments.createMap()\n            phaseMap.putString(\"formattedPrice\", phase.formattedPrice)\n            phaseMap.putString(\"priceCurrencyCode\", phase.priceCurrencyCode)\n            phaseMap.putString(\"billingPeriod\", phase.billingPeriod)\n            phases.pushMap(phaseMap)\n          }\n          offerMap.putArray(\"pricingPhases\", phases)\n          offers.pushMap(offerMap)\n        }\n        map.putArray(\"subscriptionOffers\", offers)\n        array.pushMap(map)\n      }\n      promise.resolve(array)\n    }\n  }\n\n  @ReactMethod fun purchase(productId: String, productType: String, offerToken: String?, obfuscatedAccountId: String?, promise: Promise) {\n    val activity = reactContext.currentActivity ?: run { promise.reject(\"BILLING_NO_ACTIVITY\", \"PregaLove must be open to start checkout.\"); return }\n    val c = client()\n    if (!c.isReady) { promise.reject(\"BILLING_NOT_READY\", \"Google Play Billing is not connected.\"); return }\n    if (purchasePromise != null) { promise.reject(\"BILLING_PURCHASE_ACTIVE\", \"A purchase is already in progress.\"); return }\n    val type = if (productType == \"subs\") BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP\n    val query = QueryProductDetailsParams.newBuilder().setProductList(listOf(QueryProductDetailsParams.Product.newBuilder().setProductId(productId).setProductType(type).build())).build()\n    c.queryProductDetailsAsync(query) { result, detailsResult ->\n      if (result.responseCode != BillingClient.BillingResponseCode.OK) { promise.reject(\"BILLING_PRODUCT_\${result.responseCode}\", result.debugMessage); return@queryProductDetailsAsync }\n      val details = detailsResult.productDetailsList.firstOrNull() ?: run { promise.reject(\"BILLING_PRODUCT_NOT_FOUND\", \"Google Play did not return this product.\"); return@queryProductDetailsAsync }\n      val productParamsBuilder = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details)\n      if (type == BillingClient.ProductType.SUBS) {\n        val token = offerToken ?: details.subscriptionOfferDetails?.firstOrNull()?.offerToken\n        if (token.isNullOrBlank()) { promise.reject(\"BILLING_OFFER_NOT_FOUND\", \"No eligible subscription offer is available.\"); return@queryProductDetailsAsync }\n        productParamsBuilder.setOfferToken(token)\n      }\n      val flowBuilder = BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(productParamsBuilder.build()))\n      if (!obfuscatedAccountId.isNullOrBlank()) flowBuilder.setObfuscatedAccountId(obfuscatedAccountId.take(64))\n      purchasePromise = promise\n      val launch = c.launchBillingFlow(activity, flowBuilder.build())\n      if (launch.responseCode != BillingClient.BillingResponseCode.OK) { purchasePromise = null; promise.reject(\"BILLING_LAUNCH_\${launch.responseCode}\", launch.debugMessage) }\n    }\n  }\n\n  @ReactMethod fun queryPurchases(productType: String, promise: Promise) {\n    val c = client()\n    if (!c.isReady) { promise.reject(\"BILLING_NOT_READY\", \"Google Play Billing is not connected.\"); return }\n    val type = if (productType == \"subs\") BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP\n    c.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(type).build()) { result, purchases ->\n      if (result.responseCode != BillingClient.BillingResponseCode.OK) promise.reject(\"BILLING_PURCHASES_\${result.responseCode}\", result.debugMessage)\n      else promise.resolve(purchaseArray(purchases))\n    }\n  }\n\n  override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {\n    val p = purchasePromise ?: return\n    purchasePromise = null\n    when (result.responseCode) {\n      BillingClient.BillingResponseCode.OK -> p.resolve(purchaseArray(purchases ?: emptyList()))\n      BillingClient.BillingResponseCode.USER_CANCELED -> p.resolve(Arguments.createArray())\n      else -> p.reject(\"BILLING_PURCHASE_\${result.responseCode}\", result.debugMessage)\n    }\n  }\n\n  private fun purchaseArray(purchases: List<Purchase>): WritableArray {\n    val array = Arguments.createArray()\n    purchases.forEach { purchase ->\n      val map = Arguments.createMap()\n      map.putString(\"purchaseToken\", purchase.purchaseToken)\n      map.putString(\"orderId\", purchase.orderId)\n      map.putDouble(\"purchaseTime\", purchase.purchaseTime.toDouble())\n      map.putInt(\"purchaseState\", purchase.purchaseState)\n      map.putBoolean(\"acknowledged\", purchase.isAcknowledged)\n      map.putArray(\"products\", Arguments.fromList(purchase.products))\n      array.pushMap(map)\n    }\n    return array\n  }\n}\n`);
    return mod;
  }]);
};

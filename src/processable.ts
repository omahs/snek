export enum Event {
  createClass = 'NFT.ClassCreated',
  createInstance = 'NFT.InstanceMinted',
  transfer = 'NFT.InstanceTransferred',
  burn = 'NFT.InstanceBurned',
  destroy = 'NFT.ClassDestroyed',
  createCollection = 'NFT.CollectionCreated',
  createItem = 'NFT.ItemMinted',
  transferItem = 'NFT.ItemTransferred',
  burnItem = 'NFT.ItemBurned',
  destroyCollection = 'NFT.CollectionDestroyed',
  priceUpdate = 'Marketplace.TokenPriceUpdated',
  sold = 'Marketplace.TokenSold',
  placeOffer = 'Marketplace.OfferPlaced',
  withdrawOffer = 'Marketplace.OfferWithdrawn',
  acceptOffer = 'Marketplace.OfferAccepted',
  payRoyalty = 'Marketplace.RoyaltyPaid',
  addRoyalty = 'Marketplace.RoyaltyAdded',
  registerAsset = 'AssetRegistry.Registered',
  updateAsset = 'AssetRegistry.Updated',
  setAssetMetadata = 'AssetRegistry.MetadataSet',
}

export enum Extrinsic {
  createClass = 'NFT.create_class',
  mint = 'NFT.mint',
  transfer = 'NFT.transfer',
  burn = 'NFT.burn',
  destroyClass = 'NFT.destroy_class',
  acceptOffer = 'Marketplace.accept_offer',
  addRoyalty = 'Marketplace.add_royalty',
  buy = 'Marketplace.buy',
  makeOffer = 'Marketplace.make_offer',
  setPrice = 'Marketplace.set_price',
  withdrawOffer = 'Marketplace.withdraw_offer',
}

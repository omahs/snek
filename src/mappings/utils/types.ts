import { Interaction } from '../../model/generated/_interaction'
import { Attribute } from '../../model/generated/_attribute'
import {EventHandlerContext } from '@subsquid/substrate-processor'
import { nanoid } from 'nanoid'
import { CollectionType } from '../../model/generated/_collectionType'

export type BaseCall = {
  caller: string;
  blockNumber: string;
  timestamp: Date;
}

export { Interaction }

export type CollectionInteraction = Interaction.MINT | Interaction.DESTROY

export function collectionEventFrom(interaction: CollectionInteraction,  basecall: BaseCall, meta: string): IEvent {
  return eventFrom(interaction, basecall, meta)
}

export function eventFrom(interaction: Interaction,  { blockNumber, caller, timestamp }: BaseCall, meta: string, currentOwner?: string): IEvent {
  return {
    interaction,
    blockNumber: BigInt(blockNumber),
    caller,
    currentOwner: currentOwner ?? caller,
    timestamp,
    meta
  }
}

export function attributeFrom(attribute: MetadataAttribute): Attribute {
  return new Attribute({}, {
    display: String(attribute.display_type),
    trait: String(attribute.trait_type),
    value: String(attribute.value)
  })
}

export type Context = EventHandlerContext

export type Optional<T> = T | null

export interface IEvent {
  interaction: Interaction;
  blockNumber: bigint,
  caller: string,
  currentOwner: string,
  timestamp: Date,
  meta: string;
}

export type BaseCollectionEvent = {
  id: string;
  caller: string;
}

export type BaseTokenEvent = {
  collectionId: string;
  sn: string;
}

export type OptionalMeta = {
  metadata?: string;
}

export type CreateCollectionEvent = BaseCollectionEvent & OptionalMeta & {
  type: string | CollectionType;
}

export type CreateTokenEvent = BaseTokenEvent & {
  caller: string;
  metadata?: string;
}

export type TransferTokenEvent = BaseTokenEvent & {
  caller: string;
  to: string;
}

export type ListTokenEvent = BaseTokenEvent & {
  caller: string;
  price?: bigint
}

export type BuyTokenEvent = ListTokenEvent & {
  currentOwner: string;
}

export type BurnTokenEvent = CreateTokenEvent

export type DestroyCollectionEvent = BaseCollectionEvent

export type AddRoyaltyEvent = BaseTokenEvent & {
  recipient: string;
  royalty: number;
}

export type PayRoyaltyEvent = AddRoyaltyEvent & {
  amount: bigint;
}

export type CallWith<T> = BaseCall & T

export type EntityConstructor<T> = {
  new (...args: any[]): T;
};

export type SomethingWithMeta = {
  metadata: string
}

export type SomethingWithOptionalMeta = {
  metadata?: string
}

export type UnwrapFunc<T> = (ctx: Context) => T
export type SanitizerFunc = (url: string) => string

export function ensure<T>(value: any): T {
  return value as T
}

export const eventId = (id: string, event: Interaction) => `${id}-${event}-${nanoid()}`

export type TokenMetadata = {
  name?: string
  description: string
  external_url?: string
  image: string
  animation_url?: string
  attributes?: MetadataAttribute[]
}

export type MetadataAttribute = {
  display_type?: DisplayType
  trait_type?: string
  value: number | string
}

export enum DisplayType {
  null,
  'boost_number',
  'number',
  'boost_percentage',
}

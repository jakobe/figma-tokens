import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { Dispatch } from '@/app/store';
import { notifyToUI } from '../../../plugin/notifiers';
import * as pjs from '../../../../package.json';
import useStorage from '../useStorage';
import { compareUpdatedAt } from '@/utils/date';
import { themesListSelector, tokensSelector } from '@/selectors';
import { UpdateRemoteFunctionPayload } from '@/types/UpdateRemoteFunction';
import { JSONBinTokenStorage } from '@/storage';
import { AsyncMessageTypes } from '@/types/AsyncMessages';
import { AsyncMessageChannel } from '@/AsyncMessageChannel';
import { StorageProviderType } from '@/constants/StorageProviderType';
import { StorageTypeCredentials, StorageTypeFormValues } from '@/types/StorageType';

export async function updateJSONBinTokens({
  tokens, themes, context, updatedAt, oldUpdatedAt = null,
}: UpdateRemoteFunctionPayload) {
  const { id, secret } = context;
  try {
    if (!id || !secret) throw new Error('Missing JSONBin ID or secret');

    const storage = new JSONBinTokenStorage(id, secret);

    const payload = {
      tokens,
      themes,
      metadata: {
        updatedAt: updatedAt ?? new Date().toISOString(),
        version: pjs.plugin_version,
      },
    };

    if (oldUpdatedAt) {
      const remoteTokens = await storage.retrieve();
      const comparison = await compareUpdatedAt(oldUpdatedAt, remoteTokens?.metadata?.updatedAt ?? '');
      if (comparison === 'remote_older') {
        storage.save(payload);
      } else {
        // Tell the user to choose between:
        // A) Pull Remote values and replace local changes
        // B) Overwrite Remote changes
        notifyToUI('Error updating tokens as remote is newer, please update first', { error: true });
      }
    } else {
      storage.save(payload);
    }
  } catch (e) {
    console.log('Error updating jsonbin', e);
  }
}

export function useJSONbin() {
  const dispatch = useDispatch<Dispatch>();
  const { setStorageType } = useStorage();
  const tokens = useSelector(tokensSelector);
  const themes = useSelector(themesListSelector);

  const createNewJSONBin = useCallback(async (context: Extract<StorageTypeFormValues<false>, { provider: StorageProviderType.JSONBIN }>) => {
    const { secret, name, internalId } = context;
    const updatedAt = new Date().toISOString();
    const result = await JSONBinTokenStorage.create(name, updatedAt, secret);
    if (result) {
      updateJSONBinTokens({
        tokens,
        context: {
          id: result.metadata.id,
          secret,
        },
        themes,
        updatedAt,
      });
      AsyncMessageChannel.message({
        type: AsyncMessageTypes.CREDENTIALS,
        credential: {
          provider: StorageProviderType.JSONBIN,
          id: result.metadata.id,
          internalId,
          name,
          secret,
        },
      });
      dispatch.uiState.setProjectURL(`https://jsonbin.io/${result.metadata.id}`);

      return result.metadata.id;
    }
    notifyToUI('Something went wrong. See console for details', { error: true });
    return null;
  }, [dispatch, themes, tokens]);

  // Read tokens from JSONBin
  const pullTokensFromJSONBin = useCallback(async (context: Extract<StorageTypeCredentials, { provider: StorageProviderType.JSONBIN }>) => {
    const {
      id, secret, name, internalId,
    } = context;
    if (!id || !secret) return null;

    try {
      const storage = new JSONBinTokenStorage(id, secret);
      const data = await storage.retrieve();
      dispatch.uiState.setProjectURL(`https://jsonbin.io/${id}`);

      AsyncMessageChannel.message({
        type: AsyncMessageTypes.CREDENTIALS,
        credential: {
          id,
          internalId,
          name,
          secret,
          provider: StorageProviderType.JSONBIN,
        },
      });

      if (data?.metadata && data?.tokens) {
        dispatch.tokenState.setEditProhibited(false);

        return data;
      }
      notifyToUI('No tokens stored on remote', { error: true });
      return null;
    } catch (e) {
      notifyToUI('Error fetching from JSONbin, check console (F12)', { error: true });
      console.log('Error:', e);
      return null;
    }
  }, [dispatch]);

  const addJSONBinCredentials = useCallback(async (context: Extract<StorageTypeFormValues<false>, { provider: StorageProviderType.JSONBIN }>) => {
    const {
      provider, id, name, secret, internalId,
    } = context;
    if (!id || !secret) return null;

    const content = await pullTokensFromJSONBin({
      provider,
      id,
      name,
      secret,
      internalId,
    });
    if (content) {
      dispatch.uiState.setApiData({
        provider, id, name, secret, internalId,
      });
      setStorageType({
        provider: {
          provider, id, name, internalId,
        },
        shouldSetInDocument: true,
      });
      dispatch.tokenState.setLastSyncedState(JSON.stringify([content.tokens, content.themes], null, 2));
      dispatch.tokenState.setTokenData({
        values: content.tokens,
        themes: content.themes,
      });
    }

    return content;
  }, [dispatch, pullTokensFromJSONBin, setStorageType]);

  return useMemo(() => ({
    addJSONBinCredentials,
    pullTokensFromJSONBin,
    createNewJSONBin,
  }), [
    addJSONBinCredentials,
    pullTokensFromJSONBin,
    createNewJSONBin,
  ]);
}

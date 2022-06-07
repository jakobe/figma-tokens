import React from 'react';
import { useSelector } from 'react-redux';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from './ContextMenu';
import Stack from './Stack';
import Button from './Button';
import Heading from './Heading';
import Input from './Input';
import Modal from './Modal';
import useManageTokens from '../store/useManageTokens';
import { editProhibitedSelector } from '@/selectors';

export type Props = {
  id: string
  label: string
  path: string
  type: string
};

export default function TokenGroupHeading({
  label, path, id, type,
}: Props) {
  const editProhibited = useSelector(editProhibitedSelector);
  const [newTokenGroupName, setNewTokenGroupName] = React.useState<string>('');
  const [showNewGroupNameField, setShowNewGroupNameField] = React.useState<boolean>(false);
  const [oldTokenGroupName, setOldTokenGroupName] = React.useState<string>('');
  const [isTokenGroupDuplicated, setIsTokenGroupDuplicated] = React.useState<boolean>(false);
  const [copyName, setCopyName] = React.useState<string>('');
  const { deleteGroup, renameGroup, duplicateGroup } = useManageTokens();

  React.useEffect(() => {
    setNewTokenGroupName(`${path.split('.').pop()}${copyName}` || '');
    setOldTokenGroupName(`${path.split('.').pop()}${copyName}` || '');
  }, [oldTokenGroupName, isTokenGroupDuplicated, copyName, path]);

  const handleDelete = React.useCallback(() => {
    deleteGroup(path);
  }, [path, deleteGroup]);

  const handleRename = React.useCallback(() => {
    setShowNewGroupNameField(true);
  }, []);

  const handleRenameTokenGroupSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setShowNewGroupNameField(false);
    renameGroup(`${path}${copyName}`, `${newTokenGroupName}`, type);
    setIsTokenGroupDuplicated(false);
    setCopyName('');
  }, [isTokenGroupDuplicated, newTokenGroupName, path, renameGroup, type]);

  const handleNewTokenGroupNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTokenGroupName(e.target.value);
  }, []);

  const handleSetNewTokenGroupNameFileClose = React.useCallback(() => {
    setShowNewGroupNameField(false);
  }, []);

  const handleDuplicate = React.useCallback(() => {
    duplicateGroup(path, type);
    setIsTokenGroupDuplicated(true);
    setCopyName('-copy');
    setShowNewGroupNameField(true);
  }, [duplicateGroup, path, type]);
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger id={`group-heading-${path}-${label}-${id}`}>
          <Heading muted size="small">{label}</Heading>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled={editProhibited} onSelect={handleDelete}>
            Delete
          </ContextMenuItem>
          <ContextMenuItem disabled={editProhibited} onSelect={handleRename}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem disabled={editProhibited} onSelect={handleDuplicate}>
            Duplicate
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <Modal
        title={`Rename ${oldTokenGroupName}`}
        isOpen={showNewGroupNameField}
        close={handleSetNewTokenGroupNameFileClose}
        footer={(
          <form id="renameTokenGroup" onSubmit={handleRenameTokenGroupSubmit}>
            <Stack direction="row" gap={4}>
              <Button variant="secondary" size="large" onClick={handleSetNewTokenGroupNameFileClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="large" disabled={oldTokenGroupName === newTokenGroupName}>
                Change
              </Button>
            </Stack>
          </form>
        )}
      >
        <Stack direction="column" justify="center" gap={4} css={{ textAlign: 'center' }}>
          <Heading size="small">Renaming only affects tokens of the same type</Heading>
          <Stack direction="column" gap={4}>
            <Input
              form="renameTokenGroup"
              full
              onChange={handleNewTokenGroupNameChange}
              type="text"
              name="tokengroupname"
              value={newTokenGroupName}
              required
            />
          </Stack>
        </Stack>
      </Modal>
    </>
  );
}

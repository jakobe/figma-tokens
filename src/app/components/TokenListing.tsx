import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { DeepKeyTokenMap, EditTokenObject, TokenTypeSchema } from '@/types/tokens';
import Heading from './Heading';
import TokenTree, { ShowFormOptions, ShowNewFormOptions } from './TokenTree';
import Tooltip from './Tooltip';
import { Dispatch } from '../store';
import { TokenTypes } from '@/constants/TokenTypes';
import {
  collapsedSelector, displayTypeSelector, editProhibitedSelector, showEmptyGroupsSelector,
} from '@/selectors';
import IconButton from './IconButton';
import ListIcon from '@/icons/list.svg';
import GridIcon from '@/icons/grid.svg';
import AddIcon from '@/icons/add.svg';
import ProBadge from './ProBadge';
import { useFlags } from './LaunchDarkly';

type Props = {
  tokenKey: string
  label: string
  schema: TokenTypeSchema
  values: DeepKeyTokenMap
  isPro?: boolean
};

const TokenListing: React.FC<Props> = ({
  tokenKey,
  label,
  schema,
  values,
  isPro,
}) => {
  const editProhibited = useSelector(editProhibitedSelector);
  const displayType = useSelector(displayTypeSelector);
  const showEmptyGroups = useSelector(showEmptyGroupsSelector);
  const collapsed = useSelector(collapsedSelector);
  const dispatch = useDispatch<Dispatch>();
  const { gitBranchSelector } = useFlags();

  const showDisplayToggle = React.useMemo(() => schema.type === TokenTypes.COLOR, [schema.type]);

  const [isIntCollapsed, setIntCollapsed] = React.useState(false);

  const showForm = React.useCallback(({ token, name, isPristine = false }: ShowFormOptions) => {
    dispatch.uiState.setShowEditForm(true);
    dispatch.uiState.setEditToken({
      ...token,
      type: schema.type,
      schema,
      isPristine,
      initialName: name,
      name,
    } as EditTokenObject);
  }, [schema, dispatch]);

  const showNewForm = React.useCallback(({ name = '' }: ShowNewFormOptions) => {
    showForm({ token: null, name, isPristine: true });
  }, [showForm]);

  const handleShowNewForm = React.useCallback(() => showNewForm({ }), [showNewForm]);

  const handleToggleDisplayType = React.useCallback(() => {
    dispatch.uiState.setDisplayType(displayType === 'GRID' ? 'LIST' : 'GRID');
  }, [displayType, dispatch]);

  const handleSetIntCollapsed = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (e.altKey) {
      dispatch.uiState.toggleCollapsed();
    } else {
      setIntCollapsed(!isIntCollapsed);
    }
  }, [dispatch, isIntCollapsed]);

  React.useEffect(() => {
    setIntCollapsed(collapsed);
  }, [collapsed]);

  if (!values && !showEmptyGroups) return null;

  return (
    <div className="border-b border-border-muted" data-cy={`tokenlisting-${tokenKey}`}>
      <div className="relative flex items-center justify-between space-x-8">
        <button
          className={`flex items-center w-full h-full p-4 space-x-2 hover:bg-background-subtle focus:outline-none ${
            isIntCollapsed ? 'opacity-50' : null
          }`}
          data-cy={`tokenlisting-header-${tokenKey}`}
          type="button"
          onClick={handleSetIntCollapsed}
        >
          <Tooltip label={`Alt + Click to ${collapsed ? 'expand' : 'collapse'} all`}>
            <div className="p-2 -m-2">
              {isIntCollapsed ? (
                <svg width="6" height="6" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3L1 0v6l4-3z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="6" height="6" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5l3-4H0l3 4z" fill="currentColor" />
                </svg>
              )}
            </div>
          </Tooltip>
          <Heading size="small">{label}</Heading>
          {isPro ? <ProBadge /> : null}
        </button>
        <div className="absolute right-0 flex mr-2">
          {showDisplayToggle && (
            <IconButton icon={displayType === 'GRID' ? <ListIcon /> : <GridIcon />} tooltip={displayType === 'GRID' ? 'Show as List' : 'Show as Grid'} onClick={handleToggleDisplayType} />
          )}

          <IconButton
            dataCy="button-add-new-token"
            // TODO: Add proper logic to disable adding a token type depending on flags
            disabled={editProhibited || (isPro && !gitBranchSelector)}
            icon={<AddIcon />}
            tooltip="Add a new token"
            onClick={handleShowNewForm}
          />
        </div>
      </div>
      {values && (
        <DndProvider backend={HTML5Backend}>
          <div
            className={`px-4 pb-4 ${isIntCollapsed ? 'hidden' : null}`}
            data-cy={`tokenlisting-${tokenKey}-content`}
          >
            <TokenTree
              tokenValues={values}
              showNewForm={showNewForm}
              showForm={showForm}
              schema={schema}
              displayType={displayType}
            />
          </div>
        </DndProvider>
      )}
    </div>
  );
};

// @README the memo props check used to be a deep equals
// but because the token sorting is done based on the order of an object
// it comes as back as equals since object key order is disregarded in lodash's
// isEqual check.
// @TODO we should probably not rely on object key order for sorting anyways
// since JS technically does not always ensure the same order of object keys.
// in practice this is always the case but it is something to keep in mind in theory
export default React.memo(TokenListing);

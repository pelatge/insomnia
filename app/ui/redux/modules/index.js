import {bindActionCreators, combineReducers} from 'redux';
import entitiesReducer from './entities';
import * as entities from './entities';
import configureStore from '../create';
import globalReducer from './global';
import * as global from './global';
import * as db from '../../../common/database';
import * as models from '../../../models';
import * as fetch from '../../../common/fetch';

export async function init () {
  const store = configureStore();

  // Do things that must happen before initial render
  const {addChanges} = bindActionCreators(entities, store.dispatch);
  const {newCommand} = bindActionCreators(global, store.dispatch);

  // Restore docs in parent->child->grandchild order
  const allDocs = [
    ...(await models.settings.all()),
    ...(await models.workspace.all()),
    ...(await models.workspaceMeta.all()),
    ...(await models.environment.all()),
    ...(await models.cookieJar.all()),
    ...(await models.requestGroup.all()),
    ...(await models.requestGroupMeta.all()),
    ...(await models.request.all()),
    ...(await models.requestMeta.all())
  ];

  // Link DB changes to entities reducer/actions
  const changes = allDocs.map(doc => [db.CHANGE_UPDATE, doc]);
  addChanges(changes);
  db.onChange(addChanges);

  // Bind to fetch commands
  fetch.onCommand(newCommand);

  store.dispatch(global.init());

  return store;
}

export const reducer = combineReducers({
  entities: entitiesReducer,
  global: globalReducer,
});
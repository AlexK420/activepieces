import { t } from 'i18next';
import { Filter, Check, Workflow } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  Todo,
  STATUS_VARIANT as TodoStatusVariant,
} from '@activepieces/shared';

import { todoUtils } from './todo-utils';
import { useTodosState } from './todos-state-provider';

function TodoList() {
  const [todos, selectedTodo, setSelectedTodo] = useTodosState((state) => [
    state.todos,
    state.selectedTodo,
    state.setSelectedTodo,
  ]);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = authenticationSession.getCurrentUserId();

  const showCompleted = searchParams.get('showCompleted') === 'true';
  const showOnlyMe = searchParams.get('showOnlyMe') !== 'false';

  const handleTodoSelect = (todo: Todo) => {
    setSelectedTodo(todo);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('id', todo.id);
    setSearchParams(newParams, { replace: true });
  };

  const updateFilter = (key: string, value: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, value.toString());
    setSearchParams(newParams, { replace: true });
  };

  const filteredTodos = todos.filter((todo) => {
    if (
      !showCompleted &&
      [TodoStatusVariant.POSITIVE, TodoStatusVariant.NEGATIVE].includes(
        todo.status.variant,
      )
    ) {
      return false;
    }
    return !showOnlyMe || todo.assigneeId === currentUserId;
  });

  return (
    <div className="min-w-[400px] w-[400px] flex flex-col border-r">
      {/* Filter Bar */}
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Filter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateFilter('showOnlyMe', !showOnlyMe)}
            >
              <span className="text-sm">{t('Only Me')}</span>
              {showOnlyMe && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateFilter('showCompleted', !showCompleted)}
            >
              <span className="text-sm">{t('Show Completed')}</span>
              {showCompleted && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-1">
          {showOnlyMe && (
            <Badge variant="outline" className="text-xs">
              {t('Only Me')}
            </Badge>
          )}
          {showCompleted && (
            <Badge variant="outline" className="text-xs">
              {t('All Todos')}
            </Badge>
          )}
        </div>
      </div>

      {/* Todo List */}
      <ScrollArea className="flex-1">
        <div className="py-3 px-2 space-y-1">
          {filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <p className="text-muted-foreground text-center">
                {t('You have empty inbox')}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`rounded-lg py-4 px-4 hover:bg-accent cursor-pointer transition-colors ${
                  selectedTodo?.id === todo.id ? 'bg-accent' : ''
                }`}
                onClick={() => handleTodoSelect(todo)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Workflow className="w-4 h-4 text-muted-forseground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{todo.flow?.version.displayName || 'Workflow'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate text-left">
                      {todo.title}
                    </h3>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-2 flex-shrink-0">
                    {todoUtils.getStatusIconComponent(todo.status.variant)}
                    <p className="text-xs text-accent-foreground text-center">
                      {formatUtils.formatDateToAgo(new Date(todo.created))}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export { TodoList };
export type { Todo };

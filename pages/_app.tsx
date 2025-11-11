import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { supabase } from '../lib/supabase';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { ToastProvider } from '../contexts/ToastContext';
import '../styles/globals.css';

function TodosExample() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getTodos() {
      try {
        const { data: todos, error } = await supabase.from('todos').select();
        
        if (error) {
          console.error('Error fetching todos:', error);
          return;
        }

        if (todos && todos.length > 0) {
          setTodos(todos);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    getTodos();
  }, []);

  if (loading) {
    return <div className="p-4">Loading todos...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Todos from Supabase</h2>
      {todos.length > 0 ? (
        <ul className="space-y-2">
          {todos.map((todo, index) => (
            <li key={todo.id || index} className="p-2 bg-gray-100 rounded">
              {typeof todo === 'object' ? JSON.stringify(todo) : todo}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No todos found. Make sure you have a 'todos' table in your Supabase database.</p>
      )}
    </div>
  );
}

export default function MyApp({ Component, pageProps }: AppProps) {
  if (process.env.NODE_ENV !== 'production') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // eslint-disable-next-line no-console
      console.warn('Supabase not configured. Please set up Supabase integration via Bolt settings.');
    }
  }

  return (
    <ToastProvider>
      <WebSocketProvider>
        <Component {...pageProps} />
        {/* Uncomment the line below to test Supabase connection */}
        {/* <TodosExample /> */}
      </WebSocketProvider>
    </ToastProvider>
  );
}
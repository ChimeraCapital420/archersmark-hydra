import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AITeamMember, aiTeamData } from '@/data/aiTeamData';

interface Task {
  id: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  directive: string;
  assigned_persona_id: string;
}

const getPersonaById = (id: string): AITeamMember | undefined => {
    // This is a temporary lookup. In a larger app, you might fetch this from the DB.
    const personaMap: { [key: string]: string } = {
        'e8b9b5f5-3b1a-4b3e-8e6d-7f8a9b2c3d4e': 'Janus', // Note: Replace with actual UUIDs from your DB
        // Add other persona UUIDs here
    };
    const name = Object.keys(personaMap).find(key => key === id) ? personaMap[id] : 'Unknown';
    return aiTeamData.find(p => p.name === name);
}

const TaskCenter: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(data as Task[]);
      }
      setLoading(false);
    };

    fetchTasks();

    // Listen for real-time changes
    const channel = supabase
      .channel('tasks_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Change received!', payload);
          fetchTasks(); // Refetch all tasks on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'completed': return 'success';
        case 'in_progress': return 'info';
        case 'failed': return 'destructive';
        default: return 'secondary';
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold font-['Orbitron'] text-[#00BFFF] mb-8 text-center">
          Task Center
        </h1>
        {loading ? (
            <p className="text-center text-gray-400">Loading tasks...</p>
        ) : tasks.length === 0 ? (
            <p className="text-center text-gray-400">No tasks have been initiated.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
                const persona = getPersonaById(task.assigned_persona_id);
                return (
                    <Card key={task.id} className="bg-[#1A1A1A] border-[#444444]">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg text-gray-200">{task.directive}</CardTitle>
                                <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 pt-1">
                                Task ID: {task.id} | Assigned to: {persona?.name || 'Unknown'}
                            </p>
                        </CardHeader>
                    </Card>
                )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCenter;
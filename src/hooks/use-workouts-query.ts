import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registry } from "@/lib/repositories/registry";
import type { Workout } from "@/types/domain";
import { useAtlasStore } from "@/store/useAtlasStore";

export function useWorkoutsQuery() {
  const userId = useAtlasStore((state) => state.user?.id);
  
  return useQuery<Workout[]>({
    queryKey: ["workouts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const workouts = await registry.load((r, uid) => r.workout.getWorkouts(uid));
      return workouts ?? [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes stale-while-revalidate cache
  });
}

export function useSaveWorkoutMutation() {
  const queryClient = useQueryClient();
  const userId = useAtlasStore((state) => state.user?.id);

  return useMutation({
    mutationFn: async (workout: Workout) => {
      if (!userId) throw new Error("Unauthenticated");
      registry.save((r, uid) => r.workout.saveWorkout(uid, workout));
    },
    onMutate: async (newWorkout) => {
      await queryClient.cancelQueries({ queryKey: ["workouts", userId] });
      const previousWorkouts = queryClient.getQueryData<Workout[]>(["workouts", userId]) || [];
      
      const exists = previousWorkouts.some((w) => w.id === newWorkout.id);
      const nextWorkouts = exists
        ? previousWorkouts.map((w) => (w.id === newWorkout.id ? newWorkout : w))
        : [...previousWorkouts, newWorkout];

      queryClient.setQueryData(["workouts", userId], nextWorkouts);
      
      // Update Zustand in parallel to maintain visual consistency instantly
      useAtlasStore.setState({ workouts: nextWorkouts });

      return { previousWorkouts };
    },
    onError: (err, newWorkout, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(["workouts", userId], context.previousWorkouts);
        useAtlasStore.setState({ workouts: context.previousWorkouts });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts", userId] });
    },
  });
}

export function useDeleteWorkoutMutation() {
  const queryClient = useQueryClient();
  const userId = useAtlasStore((state) => state.user?.id);

  return useMutation({
    mutationFn: async (workoutId: string) => {
      if (!userId) throw new Error("Unauthenticated");
      registry.save((r, uid) => r.workout.deleteWorkout(uid, workoutId));
    },
    onMutate: async (workoutId) => {
      await queryClient.cancelQueries({ queryKey: ["workouts", userId] });
      const previousWorkouts = queryClient.getQueryData<Workout[]>(["workouts", userId]) || [];
      
      const nextWorkouts = previousWorkouts.filter((w) => w.id !== workoutId);

      queryClient.setQueryData(["workouts", userId], nextWorkouts);
      useAtlasStore.setState({ workouts: nextWorkouts });

      return { previousWorkouts };
    },
    onError: (err, workoutId, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(["workouts", userId], context.previousWorkouts);
        useAtlasStore.setState({ workouts: context.previousWorkouts });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts", userId] });
    },
  });
}

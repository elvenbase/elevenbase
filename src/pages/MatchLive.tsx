import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Target, ArrowLeft, Play, Pause, Clock3, Plus, Shield, Redo2, StickyNote, Repeat, Trash2, RotateCcw } from 'lucide-react'
import { useMatch, useMatchEvents, useMatchAttendance, useMatchTrialistInvites, usePlayers } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateMatch } from '@/hooks/useSupabaseData'
import { useQueryClient } from '@tanstack/react-query'
import { useCustomFormations } from '@/hooks/useCustomFormations'
import { normalizeRoleCodeFrom } from '@/utils/roleNormalization'
import { Textarea } from '@/components/ui/textarea'
import { useFinalizeMatch, useUpsertMatchPlayerStats } from '@/hooks/useSupabaseData'
import { useToast } from '@/hooks/use-toast'

// Parata icon (SVG provided by user)
const PARATA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="16" height="16" viewBox="0 0 256 256" xml:space="preserve"><g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4110902877301328 1.4110902877301044) scale(2.82 2.82)"><path d="M 58.979 50.299 l 5.826 -5.826 c 1.283 -1.283 1.283 -3.381 0 -4.664 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l 5.978 -5.978 c 1.283 -1.283 1.283 -3.381 0 -4.664 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l 2.714 -2.714 c 1.283 -1.283 1.283 -3.381 0 -4.664 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -1.95 1.95 c 1.283 -1.283 1.283 -3.381 0 -4.664 s -3.381 -1.283 -4.664 0 l -9.785 9.785 l -6.238 6.238 l 1.088 -6.17 c 0.315 -1.786 -0.889 -3.506 -2.675 -3.821 l -0.444 -0.078 c -1.786 -0.315 -3.506 0.889 -3.821 2.675 l -2.679 15.192 c -0.462 2.197 -1.183 4.136 -2.216 5.761 l 14.078 14.078 C 45.323 61.404 54.842 54.436 58.979 50.299 L 58.979 50.299 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(87,89,93); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 28.362 50.899 l -2.241 -2.241 c 1.033 -1.625 1.754 -3.564 2.216 -5.761 l 2.679 -15.192 c 0.315 -1.786 2.034 -2.99 3.821 -2.675 l 0.444 0.078 C 33.451 37.047 33.013 45.818 28.362 50.899 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 36.867 35.098 l 6.238 -6.238 l 9.785 -9.785 c 1.283 -1.283 3.381 -1.283 4.664 0 L 39.2 37.43 L 36.867 35.098 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 43.841 42.071 l 20.305 -20.305 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -9.785 9.785 l -8.188 8.188 L 43.841 42.071 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 48.558 46.745 l 17.564 -17.564 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -9.785 9.785 l -5.447 5.447 L 48.558 46.745 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 53.225 51.361 L 64.79 39.796 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -9.233 9.233 L 53.225 51.361 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 32.625 68.706 L 19.986 56.067 c -1.253 -1.253 -1.253 -3.303 0 -4.556 l 2.216 -2.216 c 1.253 -1.253 3.303 -1.253 4.556 0 l 12.639 12.639 c 1.253 1.253 1.253 3.303 0 4.556 l -2.216 2.216 C 35.928 69.959 33.878 69.959 32.625 68.706 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 24.971 57.944 c -1.005 -1.005 -1.005 -2.649 0 -3.654 l 3.391 -3.391 l -2.055 -2.055 c -1.005 -1.005 -2.649 -1.005 -3.654 0 l -3.118 3.118 c -1.005 1.005 -1.005 2.649 0 3.654 l 13.541 13.541 c 0.911 0.911 2.344 0.987 3.353 0.245 L 24.971 57.944 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><rect x="44.55" y="39.62" rx="0" ry="0" width="1" height="16.5" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -20.6576 45.8728) "/><rect x="41.77" y="42.23" rx="0" ry="0" width="1" height="15.72" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7106 -0.7036 0.7036 0.7106 -23.0108 44.2408) "/><rect x="39.06" y="44.76" rx="0" ry="0" width="1" height="14.85" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7034 -0.7108 0.7108 0.7034 -25.3634 43.5968) "/><rect x="36.44" y="47.19" rx="0" ry="0" width="1" height="13.94" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -27.4777 41.9858) "/><rect x="-2.91" y="67.05" rx="0" ry="0" width="24.67" height="2" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -45.3568 26.5992) "/><rect x="2.44" y="72.39" rx="0" ry="0" width="24.67" height="2" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -47.57 31.9418) "/><rect x="7.78" y="77.74" rx="0" ry="0" width="24.67" height="2" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -49.7831 37.2844) "/><path d="M 82.813 7.756 c -3.871 -3.676 -9.067 -5.965 -14.8 -6.077 l 1.297 5.363 l 6.605 2.707 L 82.813 7.756 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><polygon points="80.41,31.74 82.55,24.6 76.19,18.91 68.8,21.11 66.36,28.34 70.5,33.08 " style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/><polygon points="67.38,20.64 63.01,14.77 53.69,16.7 52.12,22.28 58.3,29.43 64.94,27.89 " style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/><path d="M 84.001 8.966 l -6.975 2.016 v 6.683 l 6.793 6.066 l 5.876 -0.443 C 89.567 17.783 87.442 12.773 84.001 8.966 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.482 1.7 c -6.804 0.331 -12.803 3.727 -16.638 8.843 l 3.573 4.691 l 9.344 -1.942 l 5.067 -6.021 L 66.482 1.7 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.664 45.236 V 45.17 l -0.852 -5.039 l -7.584 -2.258 l -4.711 3.017 c 3.637 2.997 8.237 4.865 13.275 5.04 l -0.117 -0.694 H 66.664 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 36.584 v -5.828 l -6.498 -7.518 l -5.544 0.571 c 0 6.326 2.657 12.027 6.911 16.062 L 57.474 36.584 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 70.86 34.539 L 67.26 39.74 l 1.047 6.19 c 6.062 -0.198 11.506 -2.828 15.386 -6.953 l -3.188 -5.746 L 70.86 34.539 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.769 2.468 c -0.027 0.027 -0.055 0.054 -0.082 0.081 L 66.482 1.7 c -6.804 0.331 -12.803 3.727 -16.638 8.843 l 3.573 4.691 l 5.042 -1.048 c 1.681 -3.945 4.455 -7.849 8.309 -11.714 V 2.468 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 53.691 16.702 l -1.568 5.581 l 4.835 5.594 c -0.81 -4.051 -0.52 -8.062 0.862 -12.033 L 53.691 16.702 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.664 45.236 V 45.17 l -0.04 -0.234 c 0.013 0.014 0.026 0.028 0.04 0.042 v -0.016 c -1.864 -2.016 -3.491 -4.023 -4.841 -6.019 c 0 0 0 0 0 0 l -3.596 -1.07 l -4.711 3.017 c 3.637 2.997 8.237 4.865 13.275 5.04 l -0.117 -0.694 H 66.664 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 36.584 v -5.828 l -6.498 -7.518 l -5.544 0.571 c 0 6.326 2.657 12.027 6.911 16.062 L 57.474 36.584 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 30.756 v 5.828 l -5.132 3.287 c 0.375 0.356 0.758 0.702 1.157 1.031 l 4.729 -3.029 l 7.584 2.258 l 0.981 5.799 c 0.26 0.009 0.519 0.02 0.78 0.02 c 0.246 0 0.489 -0.011 0.734 -0.019 L 67.26 39.74 l 3.601 -5.201 l 9.644 -1.308 l 3.188 5.747 c 0.033 -0.036 0.068 -0.07 0.101 -0.106 c 0.112 -0.119 0.22 -0.241 0.329 -0.362 c 1.57 -1.766 2.864 -3.784 3.808 -5.988 c 0.043 -0.103 0.086 -0.205 0.127 -0.309 c 0.055 -0.133 0.106 -0.268 0.159 -0.403 c 0.945 -2.512 1.441 -5.271 1.49 -8.275 c -0.001 -0.083 -0.004 -0.165 -0.006 -0.248 l -5.882 0.443 l -6.793 -6.066 v -6.683 l 6.975 -2.016 c -0.379 -0.42 -0.778 -0.821 -1.188 -1.21 l -6.898 1.994 l -6.605 -2.707 l -1.297 -5.364 c -0.147 -0.003 -0.292 -0.011 -0.44 -0.011 c -0.366 0 -0.73 0.01 -1.092 0.028 l 1.348 5.576 l -5.067 6.021 l -9.344 1.942 l -3.573 -4.691 c -0.001 0.002 -0.003 0.003 -0.004 0.005 c -1.433 1.966 -2.495 4.002 -3.219 6.101 c -0.049 0.142 -0.099 0.284 -0.145 0.428 c -0.04 0.124 -0.076 0.248 -0.114 0.372 c -0.067 0.225 -0.132 0.451 -0.193 0.678 c -0.023 0.085 -0.045 0.17 -0.067 0.254 c -0.075 0.298 -0.145 0.597 -0.208 0.9 c -0.006 0.028 -0.013 0.056 -0.018 0.084 c -0.071 0.347 -0.133 0.698 -0.188 1.051 c -0.006 0.037 -0.01 0.074 -0.015 0.111 c -0.043 0.289 -0.079 0.581 -0.111 0.874 c -0.013 0.117 -0.023 0.234 -0.034 0.351 c -0.02 0.221 -0.037 0.443 -0.051 0.665 c -0.008 0.129 -0.017 0.258 -0.023 0.387 c -0.015 0.333 -0.025 0.667 -0.025 1.003 l 5.544 -0.571 L 57.474 30.756 z M 68.801 21.107 l 7.384 -2.192 l 6.363 5.683 l -2.136 7.14 l -9.907 1.343 l -4.144 -4.736 L 68.801 21.107 z M 53.691 16.702 l 9.314 -1.936 l 4.377 5.873 l -2.445 7.253 l -6.642 1.533 l -6.173 -7.142 L 53.691 16.702 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(87,89,93); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.687 2.549 c 0.292 -0.294 0.581 -0.588 0.886 -0.882 c -0.366 0 -0.73 0.01 -1.092 0.028 L 66.687 2.549 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 30.756 v 5.828 l -5.132 3.287 c 0.375 0.356 0.758 0.702 1.157 1.031 c 0 0 0 0 0 0 l 4.729 -3.029 l 3.596 1.07 c -2.516 -3.722 -4.135 -7.41 -4.865 -11.067 l -4.835 -5.594 l 1.568 -5.581 l 4.128 -0.858 c 0.193 -0.553 0.404 -1.106 0.639 -1.658 l -5.042 1.048 l -3.573 -4.691 c -0.001 0.002 -0.003 0.003 -0.004 0.005 c -1.433 1.966 -2.494 4.001 -3.219 6.101 c -0.023 0.069 -0.047 0.137 -0.07 0.206 c -0.025 0.074 -0.051 0.147 -0.075 0.222 c -0.04 0.124 -0.076 0.248 -0.114 0.372 c -0.066 0.22 -0.129 0.441 -0.188 0.664 c -0.001 0.005 -0.003 0.01 -0.004 0.015 c -0.023 0.085 -0.045 0.169 -0.067 0.254 c -0.075 0.298 -0.145 0.598 -0.208 0.9 c -0.006 0.028 -0.013 0.055 -0.018 0.083 c -0.071 0.347 -0.133 0.698 -0.188 1.051 c -0.006 0.036 -0.01 0.073 -0.015 0.109 c -0.041 0.274 -0.074 0.549 -0.105 0.826 c -0.002 0.016 -0.004 0.033 -0.006 0.049 c -0.013 0.117 -0.023 0.234 -0.034 0.351 c -0.018 0.196 -0.032 0.392 -0.045 0.589 c -0.002 0.025 -0.004 0.051 -0.006 0.076 c -0.008 0.129 -0.017 0.258 -0.023 0.387 c -0.015 0.333 -0.025 0.667 -0.025 1.003 l 5.544 -0.571 L 57.474 30.756 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.792 45.93 c 0.26 0.009 0.519 0.02 0.78 0.02 c -0.326 -0.338 -0.637 -0.676 -0.949 -1.014 L 66.792 45.93 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/></g></svg>`
const ParataIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: PARATA_SVG }} />
)

const GOAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" xml:space="preserve"><g transform="translate(1.4066 1.4066) scale(2.81 2.81)"><path d="M 78.362 27.04 c -4.492 -4.266 -10.521 -6.921 -17.174 -7.052 l 1.505 6.224 l 7.664 3.141 L 78.362 27.04 z" fill="#f1f1f1"/><polygon points="75.58,54.87 78.06,46.58 70.67,39.99 62.1,42.53 59.27,50.93 64.08,56.43 " fill="#f1f1f1"/><polygon points="60.46,41.99 55.38,35.17 44.57,37.42 42.75,43.9 49.91,52.19 57.62,50.41 " fill="#f1f1f1"/><path d="M 79.741 28.445 l -8.093 2.339 v 7.755 l 7.882 7.039 l 6.818 -0.513 C 86.2 38.676 83.734 32.862 79.741 28.445 z" fill="#f1f1f1"/><path d="M 59.413 20.014 c -7.895 0.384 -14.856 4.324 -19.306 10.261 l 4.146 5.443 l 10.843 -2.254 l 5.88 -6.986 L 59.413 20.014 z" fill="#f1f1f1"/><path d="M 59.624 70.531 v -0.077 l -0.989 -5.847 l -8.8 -2.62 l -5.467 3.501 c 4.221 3.477 9.557 5.645 15.404 5.848 l -0.136 -0.805 H 59.624 z" fill="#f1f1f1"/><path d="M 48.96 60.492 v -6.763 l -7.54 -8.723 l -6.433 0.662 c 0 7.34 3.083 13.956 8.019 18.637 L 48.96 60.492 z" fill="#f1f1f1"/><path d="M 64.493 58.119 l -4.178 6.035 l 1.215 7.183 c 7.034 -0.23 13.351 -3.282 17.853 -8.068 l -3.699 -6.667 L 64.493 58.119 z" fill="#f1f1f1"/><path d="M 59.746 20.905 c -0.031 0.031 -0.063 0.063 -0.095 0.094 l -0.238 -0.985 c -7.895 0.384 -14.856 4.324 -19.306 10.261 l 4.146 5.443 l 5.85 -1.216 c 1.95 -4.577 5.17 -9.108 9.642 -13.592 V 20.905 z" fill="#dbdbdb"/><path d="M 44.571 37.422 l -1.819 6.476 l 5.61 6.491 c -0.939 -4.701 -0.603 -9.355 1 -13.962 L 44.571 37.422 z" fill="#dbdbdb"/><path d="M 59.624 70.531 v -0.077 l -0.046 -0.271 c 0.015 0.016 0.031 0.033 0.046 0.049 v -0.018 c -2.163 -2.339 -4.051 -4.668 -5.617 -6.985 l -4.172 -1.242 l -5.467 3.501 c 4.221 3.477 9.557 5.645 15.404 5.848 l -0.136 -0.805 H 59.624 z" fill="#dbdbdb"/><path d="M 48.96 60.492 v -6.763 l -7.54 -8.723 l -6.433 0.662 c 0 7.34 3.083 13.956 8.019 18.637 L 48.96 60.492 z" fill="#dbdbdb"/><path d="M 48.96 53.729 v 6.763 l -5.955 3.814 c 0.435 0.413 0.879 0.815 1.342 1.197 l 5.487 -3.514 l 8.8 2.62 l 1.138 6.729 c 0.301 0.01 0.602 0.023 0.906 0.023 c 0.285 0 0.568 -0.012 0.851 -0.022 l -1.215 -7.184 l 4.178 -6.035 l 11.191 -1.517 l 3.7 6.668 c 0.039 -0.041 0.079 -0.082 0.117 -0.123 c 0.13 -0.138 0.255 -0.279 0.381 -0.42 c 1.822 -2.05 3.323 -4.391 4.419 -6.948 c 0.05 -0.119 0.1 -0.238 0.148 -0.358 c 0.064 -0.155 0.124 -0.311 0.184 -0.467 c 1.097 -2.915 1.672 -6.117 1.729 -9.602 c -0.001 -0.096 -0.005 -0.192 -0.007 -0.288 l -6.826 0.514 l -7.882 -7.039 v -7.755 l 8.093 -2.339 c -0.44 -0.487 -0.903 -0.952 -1.378 -1.404 l -8.005 2.313 l -7.664 -3.141 l -1.505 -6.224 c -0.17 -0.003 -0.339 -0.013 -0.51 -0.013 c -0.425 0 -0.847 0.012 -1.267 0.032 l 1.564 6.47 l -5.88 6.986 l -10.843 2.254 l -4.146 -5.443 c -0.002 0.002 -0.003 0.004 -0.005 0.006 c -1.663 2.281 -2.895 4.643 -3.735 7.08 c -0.056 0.165 -0.115 0.33 -0.168 0.496 c -0.046 0.143 -0.088 0.288 -0.132 0.431 c -0.078 0.261 -0.154 0.523 -0.224 0.787 c -0.026 0.098 -0.052 0.197 -0.077 0.295 c -0.087 0.345 -0.168 0.693 -0.241 1.044 c -0.007 0.032 -0.015 0.065 -0.021 0.097 c -0.082 0.403 -0.155 0.81 -0.218 1.219 c -0.007 0.043 -0.011 0.086 -0.018 0.128 c -0.05 0.336 -0.092 0.674 -0.129 1.014 c -0.015 0.136 -0.027 0.272 -0.04 0.408 c -0.024 0.256 -0.043 0.514 -0.059 0.772 c -0.009 0.15 -0.019 0.299 -0.026 0.449 c -0.017 0.386 -0.029 0.774 -0.029 1.164 l 6.433 -0.662 L 48.96 53.729 z" fill="#57595d"/><path d="M 59.651 20.999 c 0.339 -0.341 0.674 -0.682 1.028 -1.023 c -0.425 0 -0.847 0.012 -1.267 0.032 L 59.651 20.999 z" fill="#3f4042"/><path d="M 48.96 53.729 v 6.763 l -5.955 3.814 c 0.435 0.413 0.879 0.815 1.342 1.197 l 5.487 -3.514 l 4.172 1.242 c -2.919 -4.318 -4.798 -8.599 -5.645 -12.841 l -5.61 -6.491 l 1.819 -6.476 l 4.791 -0.996 c 0.223 -0.642 0.469 -1.283 0.742 -1.923 l -5.85 1.216 l -4.146 -5.443 c -1.663 2.281 -2.894 4.643 -3.735 7.079 c -0.061 0.195 -0.12 0.391 -0.177 0.587 c -0.087 0.346 -0.168 0.693 -0.241 1.044 c -0.082 0.403 -0.155 0.81 -0.218 1.219 c -0.062 0.504 -0.111 1.012 -0.147 1.524 c -0.009 0.15 -0.019 0.299 -0.026 0.449 c -0.017 0.386 -0.029 0.774 -0.029 1.164 l 6.433 -0.662 L 48.96 53.729 z" fill="#3f4042"/><path d="M 59.773 71.337 c 0.301 0.01 0.602 0.023 0.906 0.023 c -0.379 -0.393 -0.739 -0.785 -1.101 -1.176 L 59.773 71.337 z" fill="#3f4042"/><path d="M 3.085 90 c -0.578 0 -1.047 -0.468 -1.047 -1.047 c 0 -0.578 0.469 -1.047 1.047 -1.047 c 45.647 0 82.783 -19.248 82.783 -42.907 S 48.732 2.093 3.085 2.093 c -0.578 0 -1.047 -0.469 -1.047 -1.047 S 2.507 0 3.085 0 c 46.801 0 84.876 20.187 84.876 45 C 87.961 69.813 49.886 90 3.085 90 z" fill="#3f4042"/><path d="M 3.085 67.102 c -0.578 0 -1.047 -0.468 -1.047 -1.047 c 0 -0.578 0.469 -1.047 1.047 -1.047 c 49.518 0 82.783 -9.966 82.783 -19.276 c 0 -9.309 -33.265 -19.276 -82.783 -19.276 c -0.578 0 -1.047 -0.469 -1.047 -1.047 s 0.469 -1.047 1.047 -1.047 c 41.721 0 84.876 7.993 84.876 21.369 S 44.807 67.102 3.085 67.102 z" fill="#3f4042"/><path d="M 58.664 78.95 c -0.182 0 -0.366 -0.047 -0.533 -0.146 c -0.497 -0.295 -0.66 -0.937 -0.366 -1.435 c 13.368 -22.522 13.376 -44.29 0.025 -64.698 c -0.317 -0.483 -0.181 -1.132 0.303 -1.449 c 0.484 -0.317 1.132 -0.181 1.449 0.303 c 13.825 21.132 13.834 43.644 0.025 66.913 C 59.369 78.767 59.022 78.95 58.664 78.95 z" fill="#3f4042"/><path d="M 33.364 86.895 c -0.138 0 -0.278 -0.028 -0.413 -0.085 c -0.531 -0.229 -0.776 -0.845 -0.547 -1.376 c 10.926 -25.371 10.951 -52.636 0.076 -81.04 c -0.206 -0.54 0.063 -1.145 0.603 -1.352 c 0.539 -0.205 1.145 0.063 1.352 0.603 c 11.076 28.93 11.039 56.727 -0.109 82.616 C 34.155 86.658 33.769 86.895 33.364 86.895 z" fill="#3f4042"/></g></svg>`
const GoalIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: GOAL_SVG }} />
)

const YELLOW_CARD_SVG = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"16\" viewBox=\"0 0 256 256\" xml:space=\"preserve\"><g transform=\"translate(1.4066 1.4066) scale(2.81 2.81)\"><path d=\"M 54.932 62.504 c 3.739 0 6.771 -3.031 6.771 -6.771 V 6.771 C 61.703 3.031 58.672 0 54.932 0 H 36.04 c -4.052 0 -7.337 3.285 -7.337 7.337 v 47.829 c 0 4.052 3.285 7.337 7.337 7.337\" fill=\"#f7d33e\"/></g></svg>`
const YellowCardIcon = ({ className = 'inline-block h-3 w-3' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: YELLOW_CARD_SVG }} />
)

const RED_CARD_SVG = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"16\" viewBox=\"0 0 256 256\" xml:space=\"preserve\"><g transform=\"translate(1.4066 1.4066) scale(2.81 2.81)\"><path d=\"M 54.932 62.504 c 3.739 0 6.771 -3.031 6.771 -6.771 V 6.771 C 61.703 3.031 58.672 0 54.932 0 H 36.04 c -4.052 0 -7.337 3.285 -7.337 7.337 v 47.829 c 0 4.052 3.285 7.337 7.337 7.337\" fill=\"#f73e42\"/></g></svg>`
const RedCardIcon = ({ className = 'inline-block h-3 w-3' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: RED_CARD_SVG }} />
)

const SUB_SVG = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 256 256\" xml:space=\"preserve\"><g transform=\"translate(1.4038 1.4038) scale(2.81 2.81)\"><path d=\"M 28.513 25.461 L 12.135 38.394 c -1.204 0.951 -2.951 0.745 -3.902 -0.459 l -7.634 -9.669 c -0.951 -1.204 -0.745 -2.951 0.459 -3.902 l 16.379 -12.932 c 1.204 -0.951 2.951 -0.745 3.902 0.459 l 7.634 9.669 C 29.923 22.763 29.718 24.511 28.513 25.461 z\" fill=\"#e5393d\"/><path d=\"M 61.676 25.512 l 16.379 12.932 c 1.204 0.951 2.951 0.745 3.902 -0.459 l 7.634 -9.669 c 0.951 -1.204 0.745 -2.951 -0.459 -3.902 L 72.753 11.482 c -1.204 -0.951 -2.951 -0.745 -3.902 0.459 l -7.634 9.669 C 60.266 22.814 60.471 24.561 61.676 25.512 z\" fill=\"#749e29\"/></g></svg>`
const SubIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: SUB_SVG }} />
)

const ASSIST_SVG = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 256 256\" xml:space=\"preserve\"><g transform=\"translate(1.4222 1.4222) scale(2.84 2.84)\"><path d=\"M 88.921 70.832 C 65.445 59.386 58.165 42.96 38.486 30.257 c -5.663 -1.416 -9.653 -3.337 -12.187 -5.698 c 0.227 6.706 3.271 12.965 12.5 18.241 C 26.364 45.648 13.326 44.637 0 41.788 c 0.093 6.46 7.473 13.831 23.934 17.461 c 6.257 1.226 11.196 4.319 15.59 7.203 c -9.956 -2.716 -18.233 -2.048 -24.581 2.504 c 5.985 1.199 10.985 2.307 15.625 5.281 C 44.104 83.366 77.657 96.693 88.921 70.832 z\" fill=\"#f9a83d\"/><path d=\"M 26.123 51.528 c 5.516 0.577 11.21 0.659 17.113 -1.46 c 13.689 -5.099 26.939 -1.726 26.939 -1.726 l 14.352 19.285 c -6.167 5.789 -12.444 11.259 -21.071 9.952 c -9.784 -1.461 -19.72 -10.749 -23.839 -16.805 c 2.642 0.591 5.479 0.638 8.547 0.036 C 38.611 58.33 30.77 55.374 26.123 51.528 z\" fill=\"#f7d33e\"/><path d=\"M 87.746 68.571 L 76.805 53.352 c -6.133 -8.978 -11.801 -19.723 -17.318 -31.04 c -0.482 -0.989 -1.602 -1.492 -2.661 -1.196 c -7.524 2.098 -14.305 0.244 -20.177 -6.444 c -0.149 -0.17 -0.281 -0.369 -0.378 -0.573 c -1.56 -3.252 -2.288 -6.15 -2.457 -8.808 c -0.084 -1.329 -1.243 -2.382 -2.558 -2.168 c -2.103 0.342 -4.615 2.115 -7.71 5.921 l -9.944 14.444 c -0.682 0.99 -0.479 2.339 0.463 3.085 l 3.124 2.473 l -1.329 2.685 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.562 -1.836 l 3.919 3.103 l -1.268 2.562 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.449 -1.755 l 18.221 14.427 c 2.415 1.743 4.814 3.364 7.204 4.91 l -0.743 2.633 c -0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.757 -1.832 c 1.303 0.779 2.601 1.526 3.897 2.248 l -0.574 2.032 c -0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.529 -1.594 c 1.462 0.744 2.92 1.456 4.373 2.129 l -0.612 2.167 c 0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.926 -2.008 c 0.005 -0.005 0.007 -0.011 0.012 -0.016 c 1.16 0.476 2.319 0.941 3.474 1.373 C 87.302 74.897 90.73 72.785 88.044 68.985 z\" fill=\"#f73e42\"/><path d=\"M 27.711 31.241 l -12.667 -9.863 c 0 0 8.458 -12.281 8.502 -12.335 C 29.767 15.644 32.139 22.88 27.711 31.241 z\" fill=\"#e5393d\"/><path d=\"M 88.044 68.985 c -1.012 -0.028 -2.211 -0.298 -3.516 -0.856 c -10.825 -4.046 -21.892 -10.031 -33.233 -18.215 L 16.19 22.119 c -0.414 -0.328 -0.676 -0.775 -0.792 -1.255 l -1.921 2.791 c -0.682 0.99 -0.479 2.339 0.463 3.085 l 3.124 2.473 l -1.329 2.685 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.562 -1.836 l 3.919 3.103 l -1.268 2.562 c -0.304 0.614 -0.138 1.357 0.399 1.783 l 1.564 1.241 c 0.508 0.403 1.222 0.421 1.75 0.043 l 2.449 -1.755 l 18.221 14.427 c 2.415 1.743 4.814 3.364 7.204 4.91 l -0.743 2.633 c -0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.757 -1.832 c 1.303 0.779 2.601 1.526 3.897 2.248 l -0.574 2.032 c 0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.529 -1.594 c 1.462 0.744 2.92 1.456 4.373 2.129 l -0.612 2.167 c 0.162 0.575 0.099 1.185 0.627 1.464 l 1.539 0.814 c 0.5 0.264 1.115 0.165 1.506 -0.243 l 1.926 -2.008 c 0.005 -0.005 0.007 -0.011 0.012 -0.016 c 1.16 0.476 2.319 0.941 3.474 1.373 C 87.302 74.897 90.73 72.785 88.044 68.985 z\" fill=\"#57595d\"/></g></svg>`
const AssistIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: ASSIST_SVG }} />
)

const FOUL_SVG = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 256 256\" xml:space=\"preserve\"><g transform=\"translate(1.4066 1.4066) scale(2.81 2.81)\"><circle cx=\"62.194\" cy=\"46.144\" r=\"17.734\" fill=\"#f1f1f1\"/><path d=\"M 43.269 47.239 c -0.024 -7.691 -6.535 -16.784 -14 -17.146 l -15.014 3.259 l 2.137 2.288 l 11.663 -0.129 c 5.559 0.259 7.939 3.997 7.957 9.489 c 0 7.621 3.182 14.488 8.273 19.385 C 41.516 59.056 43.269 53.725 43.269 47.239 z\" fill=\"#3f4042\"/><path d=\"M 51.168 45.041 c 0 -6.039 2.42 -11.508 6.333 -15.51 c -6.426 2.256 -11.042 8.36 -11.042 15.556 c 0 7.245 4.676 13.384 11.169 15.603 C 53.636 56.678 51.168 51.148 51.168 45.041 z\" fill=\"#dbdbdb\"/><circle cx=\"84.496\" cy=\"23.596\" r=\"5.506\" fill=\"#57595d\"/><circle cx=\"62.941\" cy=\"45.111\" r=\"4.641\" fill=\"#dbdbdb\"/><path d=\"M 62.924 18.087 h -9.638 v 4.994 l -4.994 -4.994 H 0 l 14.636 15.674 l -0.382 -0.409 l 15.005 -0.173 c 7.465 0.362 10.661 5.597 10.685 13.288 c 0 6.473 1.567 12.564 4.323 17.885 c 4.836 4.672 11.401 7.562 18.657 7.562 c 14.864 0 26.913 -12.049 26.913 -26.913 C 89.837 30.136 77.788 18.087 62.924 18.087 z M 63.023 61.029 c -8.817 0 -15.965 -7.148 -15.965 -15.965 c 0 -8.817 7.148 -15.965 15.965 -15.965 c 8.817 0 15.965 7.148 15.965 15.965 C 78.988 53.881 71.84 61.029 63.023 61.029 z\" fill=\"#57595d\"/></g></svg>`
const FoulIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: FOUL_SVG }} />
)

const labelForEventType = (t: string): string => {
	switch (t) {
		case 'goal': return 'Gol'
		case 'assist': return 'Assist'
		case 'yellow_card': return 'Ammonizione'
		case 'red_card': return 'Espulsione'
		case 'foul': return 'Fallo'
		case 'save': return 'Parata'
		case 'note': return 'Nota'
		case 'substitution': return 'Sostituzione'
		case 'own_goal': return 'Autogol'
		case 'pen_scored': return 'Rigore segnato'
		case 'pen_missed': return 'Rigore sbagliato'
		default: return t
	}
}

const computeScore = (events: any[]) => {
	let us = 0, opp = 0
	for (const e of events) {
		if (e.event_type === 'goal') { e.team === 'us' ? us++ : opp++ }
		if (e.event_type === 'own_goal') { e.team === 'us' ? opp++ : us++ }
		if (e.event_type === 'pen_scored') { e.team === 'us' ? us++ : opp++ }
	}
	return { us, opp }
}

const MatchLive = () => {
	const { id } = useParams<{ id: string }>()
	const { data: match } = useMatch(id || '')
	const { data: events = [] } = useMatchEvents(id || '')
	const { data: attendance = [] } = useMatchAttendance(id || '')
	const { data: trialistInvites = [] } = useMatchTrialistInvites(id || '')
	const { data: players = [] } = usePlayers()
	const { lineup, loadLineup } = useMatchLineupManager(id || '')
	useEffect(() => { if (id) loadLineup() }, [id])
	const updateMatch = useUpdateMatch()
	const queryClient = useQueryClient()
	const { formations: customFormations } = useCustomFormations()
	const finalizeMatch = useFinalizeMatch()
	const upsertStats = useUpsertMatchPlayerStats()
	const { toast } = useToast()

	const handleFinalize = async () => {
		if (!id) return
		try {
			// Compute per-player stats
			const starters = new Set<string>(Object.values(lineup?.players_data?.positions || {}).filter(Boolean) as string[])
			const benchIdsSet = new Set<string>((convocati || []).map((c:any)=>c.id))
			const substitutionEvents = (events || []).filter((e:any)=> e.event_type === 'substitution')
			const eventMinute = (e:any) => typeof e.minute === 'number' ? e.minute : null
			const maxEventMinute = (events || []).reduce((m:number, e:any)=> Math.max(m, eventMinute(e) ?? 0), 0)
			const currentMinute = Math.max(0, Math.floor(seconds/60)) + 1
			const finalMinute = Math.max(90, maxEventMinute, currentMinute)
			const participantIds = new Set<string>()
			starters.forEach(id=>participantIds.add(id))
			benchIdsSet.forEach(id=>participantIds.add(id))
			substitutionEvents.forEach((e:any)=>{ const outId = e.metadata?.out_id; const inId = e.metadata?.in_id; if(outId) participantIds.add(outId); if(inId) participantIds.add(inId) })
			;(events || []).forEach((e:any)=>{ const pid = e.player_id || e.trialist_id; if(pid) participantIds.add(pid) })
			;Array.from(onFieldIds || []).forEach((pid:string)=>participantIds.add(pid))
			const firstInMinute: Record<string, number|undefined> = {}
			const firstOutMinute: Record<string, number|undefined> = {}
			substitutionEvents.forEach((e:any)=>{
				const m = eventMinute(e) ?? finalMinute
				const outId = e.metadata?.out_id as string|undefined
				const inId = e.metadata?.in_id as string|undefined
				if (outId && firstOutMinute[outId] === undefined) firstOutMinute[outId] = m
				if (inId && firstInMinute[inId] === undefined) firstInMinute[inId] = m
			})
			const countsById: Record<string, { goals:number; assists:number; yellows:number; reds:number; fouls:number; saves:number }> = {}
			participantIds.forEach(pid=>{ countsById[pid] = { goals:0, assists:0, yellows:0, reds:0, fouls:0, saves:0 } })
			;(events || []).forEach((e:any)=>{
				const pid = e.player_id || e.trialist_id
				if (!pid || !countsById[pid]) return
				switch(e.event_type){
					case 'goal': countsById[pid].goals++; break
					case 'assist': countsById[pid].assists++; break
					case 'yellow_card': countsById[pid].yellows++; break
					case 'red_card': countsById[pid].reds++; break
					case 'foul': countsById[pid].fouls++; break
					case 'save': countsById[pid].saves++; break
					case 'pen_scored': countsById[pid].goals++; break
					default: break
				}
			})
			const rows: any[] = []
			participantIds.forEach(pid=>{
				const started = starters.has(pid)
				const inMin = started ? 0 : (firstInMinute[pid] ?? (onFieldIds.has(pid) ? 0 : undefined))
				const outMin = firstOutMinute[pid] ?? undefined
				const startAt = inMin ?? undefined
				const playedMinutes = startAt === undefined ? 0 : Math.max(0, (outMin ?? finalMinute) - startAt)
				const c = countsById[pid] || { goals:0, assists:0, yellows:0, reds:0, fouls:0, saves:0 }
				const base = {
					match_id: id,
					started,
					minutes: playedMinutes,
					goals: c.goals,
					assists: c.assists,
					yellow_cards: c.yellows,
					red_cards: c.reds,
					fouls_committed: c.fouls,
					saves: c.saves,
					sub_in_minute: inMin ?? null,
					sub_out_minute: outMin ?? null,
					was_in_squad: starters.has(pid) || benchIdsSet.has(pid)
				}
				if (isTrialistId(pid)) rows.push({ ...base, trialist_id: pid })
				else rows.push({ ...base, player_id: pid })
			})
			await upsertStats.mutateAsync({ rows })

			// Mark match ended with final score
			await finalizeMatch.mutateAsync({ matchId: id as string, ourScore: score.us, opponentScore: score.opp })
			// Stop timer locally and refresh queries
			setRunning(false)
			queryClient.invalidateQueries({ queryKey: ['match', id] })
			queryClient.invalidateQueries({ queryKey: ['match-events', id] })
			toast({ title: 'Partita terminata' })
		} catch (e: any) {
			console.error('Errore finalizzazione', e)
			toast({ title: 'Errore finalizzazione', description: String(e?.message || e), variant: 'destructive' })
		}
	}

	// Static formations (subset) for role mapping
	const staticFormations: any = {
		'4-4-2': { positions: [
			{ id: 'gk', roleShort: 'P', role: 'Portiere' },
			{ id: 'rb', roleShort: 'TD', role: 'Terzino Destro' },
			{ id: 'cb1', roleShort: 'DC', role: 'Difensore Centrale' },
			{ id: 'cb2', roleShort: 'DC', role: 'Difensore Centrale' },
			{ id: 'lb', roleShort: 'TS', role: 'Terzino Sinistro' },
			{ id: 'rm', roleShort: 'ED', role: 'Esterno Destro' },
			{ id: 'cm1', roleShort: 'MC', role: 'Centrocampista' },
			{ id: 'cm2', roleShort: 'MC', role: 'Centrocampista' },
			{ id: 'lm', roleShort: 'ES', role: 'Esterno Sinistro' },
			{ id: 'st1', roleShort: 'ATT', role: 'Attaccante' },
			{ id: 'st2', roleShort: 'ATT', role: 'Attaccante' }
		]},
		'4-3-3': { positions: [
			{ id: 'gk', roleShort: 'P', role: 'Portiere' },
			{ id: 'rb', roleShort: 'TD', role: 'Terzino Destro' },
			{ id: 'cb1', roleShort: 'DC', role: 'Difensore Centrale' },
			{ id: 'cb2', roleShort: 'DC', role: 'Difensore Centrale' },
			{ id: 'lb', roleShort: 'TS', role: 'Terzino Sinistro' },
			{ id: 'cdm', roleShort: 'MED', role: 'Mediano' },
			{ id: 'cm1', roleShort: 'MD', role: 'Mezzala Dx' },
			{ id: 'cm2', roleShort: 'MS', role: 'Mezzala Sx' },
			{ id: 'rw', roleShort: 'AD', role: 'Ala Destra' },
			{ id: 'st', roleShort: 'PU', role: 'Punta' },
			{ id: 'lw', roleShort: 'AS', role: 'Ala Sinistra' }
		]},
		'3-5-2': { positions: [
			{ id: 'gk', roleShort: 'P', role: 'Portiere' },
			{ id: 'cb1', roleShort: 'DCD', role: 'Centrale Dx' },
			{ id: 'cb2', roleShort: 'DC', role: 'Centrale' },
			{ id: 'cb3', roleShort: 'DCS', role: 'Centrale Sx' },
			{ id: 'rwb', roleShort: 'QD', role: 'Quinto Dx' },
			{ id: 'cm1', roleShort: 'MC', role: 'Centrocampista' },
			{ id: 'cm2', roleShort: 'REG', role: 'Regista' },
			{ id: 'cm3', roleShort: 'MC', role: 'Centrocampista' },
			{ id: 'lwb', roleShort: 'QS', role: 'Quinto Sx' },
			{ id: 'st1', roleShort: 'ATT', role: 'Attaccante' },
			{ id: 'st2', roleShort: 'ATT', role: 'Attaccante' }
		]}
	}

	// Bench (convocati) from DB
	const [bench, setBench] = useState<any[]>([])
	const loadBench = async () => {
		if (!id) return
		const { data, error } = await supabase
			.from('match_bench')
			.select(`id, match_id, player_id, trialist_id,
				players:player_id(id, first_name, last_name, avatar_url),
				trialists:trialist_id(id, first_name, last_name, avatar_url)
			`)
			.eq('match_id', id)
		if (!error) setBench(data || [])
	}
	useEffect(() => { loadBench() }, [id])

	const score = useMemo(() => computeScore(events), [events])
	const presentIds = useMemo(() => new Set(attendance.filter((a: any) => a.status === 'present').map((a: any) => a.player_id)), [attendance])
	const titolariIds = useMemo(() => new Set(Object.values(lineup?.players_data?.positions || {})), [lineup])
	const trialistsPresent = useMemo(() => (trialistInvites as any[]).filter(t => t.status === 'present').map(t => ({ id: t.trialist_id, first_name: t.trialists?.first_name || 'Trialist', last_name: t.trialists?.last_name || '', isTrialist: true })), [trialistInvites])
	const titolari = useMemo(() => {
		const roster = players.filter((p: any) => titolariIds.has(p.id))
		const tr = trialistsPresent.filter((t: any) => titolariIds.has(t.id))
		return [...roster, ...tr]
	}, [players, titolariIds, trialistsPresent])
	const hasValidLineup = useMemo(() => {
		const ids = Array.from(titolariIds)
		return ids.filter(Boolean).length >= 11
	}, [titolariIds])
	const convocati = useMemo(() => {
		// Convocati = lista panchina (match_bench)
		return (bench || []).map((b: any) => {
			const p = b.players || b.trialists
			if (p) return { id: p.id, first_name: p.first_name, last_name: p.last_name, isTrialist: !!b.trialist_id }
			// Fallback se join missing
			return { id: (b.player_id || b.trialist_id), first_name: 'N/A', last_name: '', isTrialist: !!b.trialist_id }
		})
	}, [bench])
	const playersById = useMemo(() => Object.fromEntries(players.map((p: any) => [p.id, p])), [players])
	const trialistsById = useMemo(() => Object.fromEntries(trialistInvites.map((t: any) => [t.trialist_id, { id: t.trialist_id, first_name: t.trialists?.first_name || 'Trialist', last_name: t.trialists?.last_name || '', isTrialist: true }])), [trialistInvites])

	// Role mapping per posizione (id -> role label)
	const roleByPosId = useMemo(() => {
		const map: Record<string,string> = {}
		const lf = lineup?.formation
		// custom formations
		const cf = (customFormations || []).find(f => f.id === lf)
		if (cf) {
			cf.positions.forEach((p: any) => { if (p.id) map[p.id] = p.roleShort || p.role || p.name || '' })
		} else if (lf && staticFormations[lf]) {
			staticFormations[lf].positions.forEach((p: any) => { map[p.id] = p.roleShort || p.role })
		}
		return map
	}, [lineup?.formation, customFormations])
	const roleByPlayerId = useMemo(() => {
		const entries = Object.entries(lineup?.players_data?.positions || {})
		const m: Record<string,string> = {}
		entries.forEach(([posId, pid]) => { if (pid) m[pid as string] = roleByPosId[posId] || '' })
		return m
	}, [lineup, roleByPosId])

	const [running, setRunning] = useState(false)
	const [seconds, setSeconds] = useState(0)
	// Initialize timer from match fields
	useEffect(() => {
		if (!match) return
		const offset = (match as any).clock_offset_seconds || 0
		const startedAt = (match as any).clock_started_at ? new Date((match as any).clock_started_at).getTime() : null
		if (startedAt) {
			setRunning(true)
			setSeconds(Math.floor((Date.now() - startedAt) / 1000) + offset)
		} else {
			setRunning(false)
			setSeconds(offset)
		}
	}, [match])
	useEffect(() => {
		if (!running) return
		const iv = setInterval(() => setSeconds(s => s + 1), 1000)
		return () => clearInterval(iv)
	}, [running])

	const postEvent = async (evt: { event_type: string; team?: 'us'|'opponent'; player_id?: string|null; assister_id?: string|null; comment?: string|null; metadata?: any }) => {
		if (!id) return
		const minute = Math.max(0, Math.floor(seconds/60)) + 1
		const period = (match as any)?.live_state || 'not_started'
		const payload: any = {
			match_id: id,
			event_type: evt.event_type,
			team: evt.team || 'us',
			minute,
			period,
			comment: evt.comment || null,
			metadata: { ...(evt.metadata || {}), live: true }
		}
		if (evt.player_id) {
			if (isTrialistId(evt.player_id)) payload.trialist_id = evt.player_id
			else payload.player_id = evt.player_id
		}
		if (evt.assister_id) {
			if (!isTrialistId(evt.assister_id)) payload.assister_id = evt.assister_id
			else payload.metadata = { ...(payload.metadata || {}), assister_trialist_id: evt.assister_id }
		}
		const { error } = await supabase.from('match_events').insert(payload)
		if (!error) {
			queryClient.invalidateQueries({ queryKey: ['match-events', id] })
		} else {
			console.error('Errore inserimento evento live:', error)
		}
	}
	const [lastEvents, setLastEvents] = useState<any[]>([])
	useEffect(() => {
		setLastEvents(events.slice(-6).reverse())
	}, [events])
	// Optimistic substitutions to reflect immediately before realtime/query refresh
	const [optimisticSubs, setOptimisticSubs] = useState<{ out_id: string; in_id: string }[]>([])
	useEffect(() => { if ((events || []).some((e: any) => e.event_type === 'substitution')) setOptimisticSubs([]) }, [events])

	// Realtime updates: refresh events on INSERT
	useEffect(() => {
		if (!id) return
		const channel = supabase
			.channel(`match-events-${id}`)
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${id}` }, (_payload) => {
				queryClient.invalidateQueries({ queryKey: ['match-events', id] })
			})
			.subscribe()
		return () => {
			try { supabase.removeChannel(channel) } catch { /* ignore */ }
		}
	}, [id])

	// Player selection for events + event selection mode
	const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
	const [flashId, setFlashId] = useState<string | null>(null)
	const [noteOpen, setNoteOpen] = useState(false)
	const [noteText, setNoteText] = useState('')
	// Penalty choice modals
	const [penaltyOpenUs, setPenaltyOpenUs] = useState(false)
	const [penaltyOpenOpp, setPenaltyOpenOpp] = useState(false)
	// Collapsible panels state
	const [inCampoCollapsed, setInCampoCollapsed] = useState(false)
	const flashRow = (pid: string) => {
		setFlashId(pid)
		setTimeout(() => setFlashId(null), 180)
	}
	const [eventMode, setEventMode] = useState<null | 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'foul' | 'save' | 'note' | 'pen_scored' | 'pen_missed'>(null)
	const toggleEventMode = (mode: NonNullable<typeof eventMode>) => {
		if ((match as any)?.live_state === 'ended') return
		setEventMode(prev => prev === mode ? null : mode)
	}
	const handleAssignEvent = async (pid: string) => {
		if (!eventMode) return
		flashRow(pid)
		setSelectedPlayerId(pid)
		if (eventMode === 'note') {
			setNoteOpen(true)
			return
		}
		await postEvent({ event_type: eventMode, player_id: pid })
		setEventMode(null)
	}
	const getDisplayName = (id: string) => {
		const p = playersById[id] || trialistsById[id]
		return p ? `${p.first_name} ${p.last_name}` : id
	}
	const isTrialistId = (id: string) => !!trialistsById[id]
	const eventStatsById = useMemo(() => {
		const stats: Record<string, { goals: number; assists: number; yellows: number; reds: number; fouls: number; saves: number }> = {}
		;(events || []).forEach((e: any) => {
			const pid = e.player_id || e.trialist_id
			if (!pid) return
			const s = stats[pid] || (stats[pid] = { goals: 0, assists: 0, yellows: 0, reds: 0, fouls: 0, saves: 0 })
			switch (e.event_type) {
				case 'goal': s.goals++; break
				case 'assist': s.assists++; break
				case 'yellow_card': s.yellows++; break
				case 'red_card': s.reds++; break
				case 'foul': s.fouls++; break
				case 'save': s.saves++; break
				case 'pen_scored': s.goals++; break
			}
		})
		return stats
	}, [events])
	const renderEventBadges = (pid: string) => {
		const s = eventStatsById[pid]
		if (!s) return null
		return (
			<div className="ml-auto flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
				{s.goals > 0 && (<span className="inline-flex items-center gap-0.5"><GoalIcon className="h-3 w-3" />{s.goals}</span>)}
				{s.assists > 0 && (<span className="inline-flex items-center gap-0.5"><AssistIcon className="h-3 w-3" />{s.assists}</span>)}
				{s.yellows > 0 && (<span className="inline-flex items-center gap-0.5 text-yellow-600"><YellowCardIcon className="h-3 w-3" />{s.yellows}</span>)}
				{s.reds > 0 && (<span className="inline-flex items-center gap-0.5 text-red-600"><RedCardIcon className="h-3 w-3" />{s.reds}</span>)}
				{s.saves > 0 && (<span className="inline-flex items-center gap-0.5 text-blue-600"><ParataIcon className="h-3 w-3" />{s.saves}</span>)}
			</div>
		)
	}

	// Derive current on-field from lineup + substitutions
	const onFieldEntries = useMemo(() => {
		const baseEntries = Object.entries(lineup?.players_data?.positions || {}) as Array<[string, string]>
		const entries = [...baseEntries]
		;(events || []).filter((e: any) => e.event_type === 'substitution').forEach((e: any) => {
			const outId = e.metadata?.out_id as string | undefined
			const inId = e.metadata?.in_id as string | undefined
			if (!outId || !inId) return
			const idx = entries.findIndex(([, pid]) => pid === outId)
			if (idx >= 0) entries[idx] = [entries[idx][0], inId]
		})
		optimisticSubs.forEach(({ out_id, in_id }) => {
			const idx = entries.findIndex(([, pid]) => pid === out_id)
			if (idx >= 0) entries[idx] = [entries[idx][0], in_id]
		})
		return entries
	}, [lineup, events])
	const onFieldIds = useMemo(() => new Set(onFieldEntries.map(([, pid]) => pid).filter(Boolean) as string[]), [onFieldEntries])
	const onFieldPlayers = useMemo(() => {
		return onFieldEntries.map(([, pid]) => {
			const p = playersById[pid] || trialistsById[pid]
			return p ? { ...p, id: pid } : { id: pid, first_name: 'N/A', last_name: '' }
		})
	}, [onFieldEntries, playersById, trialistsById])
	const roleByCurrentOnFieldPlayerId = useMemo(() => {
		const m: Record<string, string> = {}
		onFieldEntries.forEach(([posId, pid]) => { if (pid) m[pid] = roleByPosId[posId] || '' })
		return m
	}, [onFieldEntries, roleByPosId])

	// Order on-field list from GK -> DEF -> MID -> ATT
	const orderedOnFieldPlayers = useMemo(() => {
		const orderIndex = (code: string) => {
			const c = (code || '').toUpperCase()
			if (c === 'P') return 0
			if (['TD','DCD','DC','DCS','TS'].includes(c)) return 1
			if (['MED','REG','MC','MD','MS','QD','QS'].includes(c)) return 2
			if (['PU','AD','AS','ATT'].includes(c)) return 3
			return 4
		}
		return (onFieldPlayers as any[]).map((p: any) => {
			const rawRole = roleByCurrentOnFieldPlayerId[p.id] || ''
			const code = rawRole ? normalizeRoleCodeFrom({ roleShort: rawRole }) : 'ALTRI'
			return { ...p, _roleCode: code, _order: orderIndex(code) }
		}).sort((a, b) => a._order - b._order)
	}, [onFieldPlayers, roleByCurrentOnFieldPlayerId])

	// Sector helpers
	const sectorFromCode = (code: string): 'P'|'DIF'|'CEN'|'ATT'|'ALTRI' => {
		const c = (code || '').toUpperCase()
		if (c === 'P') return 'P'
		if (['TD','DCD','DC','DCS','TS'].includes(c)) return 'DIF'
		if (['MED','REG','MC','MD','MS','QD','QS'].includes(c)) return 'CEN'
		if (['PU','AD','AS','ATT'].includes(c)) return 'ATT'
		return 'ALTRI'
	}
	const roleCodeForPlayerId = (pid: string) => {
		const raw = roleByCurrentOnFieldPlayerId[pid]
		if (raw) return normalizeRoleCodeFrom({ roleShort: raw })
		const pl: any = playersById[pid]
		if (pl) return normalizeRoleCodeFrom({ role_code: pl?.role_code as any, roleShort: pl?.roleShort, role: pl?.role, name: pl?.position || (pl as any)?.position_name || '' })
		const tr = trialistsById[pid]
		if (tr) return normalizeRoleCodeFrom({ role_code: (tr as any)?.role_code as any })
		return 'ALTRI' as const
	}
	const groupedOnField = useMemo(() => {
		const groups: Record<'P'|'DIF'|'CEN'|'ATT', any[]> = { P: [], DIF: [], CEN: [], ATT: [] }
		orderedOnFieldPlayers.forEach((p: any) => {
			const code = (p._roleCode || 'ALTRI') as string
			const sector = sectorFromCode(code)
			if (sector in groups) groups[sector as 'P'|'DIF'|'CEN'|'ATT'].push(p)
		})
		return groups
	}, [orderedOnFieldPlayers])

	// Red card state map
	const hasRedById = useMemo(() => {
		const s = new Set<string>()
		;(events || []).forEach((e: any) => { const id = e.player_id || e.trialist_id; if (e.event_type === 'red_card' && id) s.add(id) })
		return s
	}, [events])
	// Yellow card state map
	const hasYellowById = useMemo(() => {
		const s = new Set<string>()
		;(events || []).forEach((e: any) => { const id = e.player_id || e.trialist_id; if (e.event_type === 'yellow_card' && id) s.add(id) })
		return s
	}, [events])
	// Players who entered via substitution (for grey border highlight)
	const enteredOnFieldIds = useMemo(() => {
		const s = new Set<string>()
		;(events || []).forEach((e: any) => { const inId = e.metadata?.in_id as string | undefined; if (e.event_type === 'substitution' && inId) s.add(inId) })
		return s
	}, [events])
	// Players who have been subbed OUT at least once (cannot re-enter)
	const subOutIds = useMemo(() => {
		const s = new Set<string>()
		;(events || []).forEach((e: any) => { const outId = e.metadata?.out_id as string | undefined; if (e.event_type === 'substitution' && outId) s.add(outId) })
		return s
	}, [events])

	// Substitution dialog
	const [subOpen, setSubOpen] = useState(false)
	const [subOutId, setSubOutId] = useState<string>('')
	const [subInId, setSubInId] = useState<string>('')
	const benchIds = useMemo(() => new Set(convocati.map((c: any) => c.id)), [convocati])
	const availableInIds = useMemo(() => Array.from(benchIds).filter((id: string) => !onFieldIds.has(id) && !subOutIds.has(id)), [benchIds, onFieldIds, subOutIds])
	const filteredBench = useMemo(() => convocati.filter((p:any)=>!onFieldIds.has(p.id)), [convocati, onFieldIds])
	const benchVisibleSorted = useMemo(() => {
		const items = filteredBench.slice()
		items.sort((a: any, b: any) => {
			const aOut = subOutIds.has(a.id)
			const bOut = subOutIds.has(b.id)
			if (aOut !== bOut) return aOut ? -1 : 1
			const an = `${a.last_name || ''} ${a.first_name || ''}`.trim().toLowerCase()
			const bn = `${b.last_name || ''} ${b.first_name || ''}`.trim().toLowerCase()
			return an.localeCompare(bn)
		})
		return items
	}, [filteredBench, subOutIds])
	const [benchCollapsed, setBenchCollapsed] = useState(true)

	// List of substituted-out players (not on field)
	const substitutedList = useMemo(() => {
		const outIds = new Set<string>()
		;(events || []).forEach((e: any) => { const outId = e.metadata?.out_id as string | undefined; if (e.event_type === 'substitution' && outId) outIds.add(outId) })
		return Array.from(outIds)
			.filter((id) => !onFieldIds.has(id))
			.map((id) => {
				const p = (playersById as any)[id] || (trialistsById as any)[id]
				return p ? { id, first_name: p.first_name, last_name: p.last_name } : { id, first_name: 'N/A', last_name: '' }
			})
	}, [events, onFieldIds, playersById, trialistsById])
	const doSubstitution = async () => {
		if (!id || !subOutId || !subInId) return
		setOptimisticSubs(prev => [...prev, { out_id: subOutId, in_id: subInId }])
		const { error } = await supabase.from('match_events').insert({ match_id: id, event_type: 'substitution', metadata: { out_id: subOutId, in_id: subInId }, team: 'us' })
		if (!error) {
			queryClient.invalidateQueries({ queryKey: ['match-events', id] })
			try {
				// Ensure OUT player is added to bench
				if (isTrialistId(subOutId)) {
					const { data: existsOut } = await supabase
						.from('match_bench')
						.select('id').eq('match_id', id).eq('trialist_id', subOutId).limit(1).maybeSingle()
					if (!existsOut) {
						await supabase.from('match_bench').insert({ match_id: id, trialist_id: subOutId })
					}
				} else {
					const { data: existsOut } = await supabase
						.from('match_bench')
						.select('id').eq('match_id', id).eq('player_id', subOutId).limit(1).maybeSingle()
					if (!existsOut) {
						await supabase.from('match_bench').insert({ match_id: id, player_id: subOutId })
					}
				}
				// Ensure IN player is removed from bench
				if (isTrialistId(subInId)) {
					await supabase.from('match_bench').delete().eq('match_id', id).eq('trialist_id', subInId)
				} else {
					await supabase.from('match_bench').delete().eq('match_id', id).eq('player_id', subInId)
				}
			} catch (benchErr) {
				console.error('Errore aggiornamento panchina dopo sostituzione:', benchErr)
			}
			await loadBench()
		} else {
			console.error('Errore inserimento sostituzione:', error)
		}
		setSubOpen(false); setSubOutId(''); setSubInId('')
	}

	// Period controls
	const period = (match as any)?.live_state || 'not_started'
	const setPeriod = async (p: string) => {
		if (!id) return
		await updateMatch.mutateAsync({ id, updates: { live_state: p as any } })
	}
	const toggleTimer = async () => {
		if (!id) return
		const now = new Date()
		if (!running) {
			await updateMatch.mutateAsync({ id, updates: { clock_started_at: now.toISOString() } })
			setRunning(true)
		} else {
			const startedAt = (match as any).clock_started_at ? new Date((match as any).clock_started_at).getTime() : null
			const prevOffset = (match as any).clock_offset_seconds || 0
			const add = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
			const newOffset = prevOffset + add
			await updateMatch.mutateAsync({ id, updates: { clock_started_at: null as any, clock_offset_seconds: newOffset } })
			setRunning(false)
			setSeconds(newOffset)
		}
	}
	const resetTimer = async () => {
		if (!id) return
		await updateMatch.mutateAsync({ id, updates: { clock_started_at: null as any, clock_offset_seconds: 0 } })
		setRunning(false)
		setSeconds(0)
	}

	const isEnded = period === 'ended'

	// Visual hint on timer group by phase
	const periodBorderClass = useMemo(() => {
		switch (period) {
			case 'half_time': return 'border-yellow-400'
			case 'first_half': return 'border-emerald-400'
			case 'second_half': return 'border-emerald-400'
			case 'extra_time': return 'border-orange-400'
			case 'ended': return 'border-neutral-400'
			default: return 'border-neutral-300'
		}
	}, [period])

	// Opponent name and home/away label for UI
	const opponentName = (
		(match as any)?.opponents?.name || (match as any)?.opponent_name || 'Avversario'
	)
	const homeAwayRaw = (match as any)?.home_away || (match as any)?.homeAway
	const homeAwayLabel = homeAwayRaw === 'home' ? '(in casa)' : homeAwayRaw === 'away' ? '(in trasferta)' : ''
	const isHome = homeAwayRaw === 'home'

	// Cronaca scroll indicators logic
	const cronacaRef = useRef<HTMLDivElement|null>(null)
	const [cronacaCanUp, setCronacaCanUp] = useState(false)
	const [cronacaCanDown, setCronacaCanDown] = useState(false)
	useEffect(() => {
		const el = cronacaRef.current
		function update() {
			const node = cronacaRef.current
			if (!node) return
			setCronacaCanUp(node.scrollTop > 0)
			setCronacaCanDown(node.scrollTop + node.clientHeight < node.scrollHeight)
		}
		update()
		if (!el) return
		el.addEventListener('scroll', update)
		window.addEventListener('resize', update)
		return () => { try { el.removeEventListener('scroll', update) } catch {}; window.removeEventListener('resize', update) }
	}, [events])

	if (!id) return null

	return (
		<div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-neutral-100">
			<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3 flex flex-col">
				{!hasValidLineup && (
					<Card className="mb-3">
						<CardContent>
							<div className="text-sm text-amber-600">
								Per avviare la live è necessaria una formazione completa di 11 titolari. Torna alla gestione partita e imposta la formazione.
							</div>
						</CardContent>
					</Card>
				)}
				{/* Header: single-row scoreboard */}
				<div className="grid grid-cols-3 items-center gap-3 py-2 border bg-white rounded-md shadow-sm px-2">
					{/* left: back + score + logo + team (with home/away) */}
					<div className="justify-self-start min-w-0">
						<div className="flex items-center gap-3 min-w-0">
							<Button variant="ghost" size="sm" asChild aria-label="Torna alla gestione" className="shrink-0">
								<Link to={`/match/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
							</Button>
							<span className="text-2xl sm:text-3xl font-extrabold tracking-tight">{isHome ? `${score.us} - ${score.opp}` : `${score.opp} - ${score.us}`}</span>
							{(match as any)?.opponents?.logo_url && (
								<img src={(match as any).opponents.logo_url} alt="logo" className="h-6 w-6 rounded-sm object-cover" />
							)}
							<span className="text-sm font-medium truncate max-w-[140px] sm:max-w-[220px]">
								{opponentName}
								{homeAwayLabel && <span className="ml-1 text-xs sm:text-sm text-muted-foreground">{homeAwayLabel}</span>}
							</span>
						</div>
					</div>
					{/* center: empty to balance layout */}
					<div className="justify-self-center" />
					{/* right: timer + phase + reset */}
					<div className="justify-self-end flex items-center gap-2">
						<div className={`flex items-center gap-2 px-2 rounded-md border bg-muted/30 h-9 ${periodBorderClass}`}>
							<Clock3 className="h-4 w-4" />
							<span className="tabular-nums font-medium">{String(Math.floor(seconds/60)).padStart(2, '0')}:{String(seconds%60).padStart(2, '0')}</span>
							<Button variant={running? 'outline':'default'} size="sm" className="h-7 px-2 rounded-md" onClick={()=>setRunning(r=>!r)} disabled={isEnded || !hasValidLineup}>
								{running ? (<><Pause className="h-4 w-4"/></>) : (<><Play className="h-4 w-4"/></>)}
							</Button>
							<Button variant="outline" size="sm" className="h-7 px-2 rounded-md" onClick={()=>{ setRunning(false); setSeconds(0) }} disabled={isEnded || !hasValidLineup} aria-label="Reset timer">
								<RotateCcw className="h-4 w-4" />
							</Button>
							<div className="h-6 w-px bg-border/70 mx-1" />
							<div className="h-full flex items-center">
								<Select value={period} onValueChange={setPeriod as any}>
									<SelectTrigger className="h-8 sm:h-9 w-[140px] border-none bg-transparent focus:ring-0 focus:outline-none"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="not_started">Pre partita</SelectItem>
										<SelectItem value="first_half">1° Tempo</SelectItem>
										<SelectItem value="half_time">Intervallo</SelectItem>
										<SelectItem value="second_half">2° Tempo</SelectItem>
										<SelectItem value="extra_time">Supplementari</SelectItem>
										<SelectItem value="ended">Fine</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<Button variant="destructive" className="h-9 rounded-md px-3" onClick={()=>{ setEventMode(null); setNoteOpen(false); handleFinalize() }} disabled={isEnded}>
							Termina partita
						</Button>
						<Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" aria-label="Reimposta layout">
							<RotateCcw className="h-4 w-4" />
						</Button>
					</div>
				</div>
									<div className="grid grid-cols-1 md:grid-cols-[25%_75%] gap-3 mt-3 items-start">
					{/* Colonna sinistra: In campo + Sostituiti */}
					<div className="flex flex-col gap-3">
						<div className="rounded-xl border border-border/30 bg-white shadow-sm overflow-hidden">
							<div className="px-3 py-2 text-sm font-semibold flex items-center justify-between bg-emerald-50 border-b border-emerald-100">
								<div className="flex items-center gap-2 text-emerald-800"><Target className="h-4 w-4" />In campo</div>
															<Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>setInCampoCollapsed(prev=>{ const next = !prev; if (!next) setBenchCollapsed(true); return next })} aria-label={"Toggle in campo"}>
								<span className="material-symbols-outlined text-[16px]">{inCampoCollapsed ? 'expand_more' : 'expand_less'}</span>
								</Button>
							</div>
							{!inCampoCollapsed && (
								<div className="p-3 space-y-3">
									{(['P','DIF','CEN','ATT'] as const).map((sec) => {
										const label = sec==='P' ? 'Portiere' : sec==='DIF' ? 'Difensori' : sec==='CEN' ? 'Centrocampisti' : 'Attaccanti'
										const playersSec = groupedOnField[sec]
										return (
											<div key={sec}>
												<div className="text-xs uppercase text-muted-foreground mb-1">{label}</div>
												{playersSec.length === 0 ? (
													<div className="text-xs text-muted-foreground">—</div>
												) : (
													<div className="space-y-1">
														{playersSec.map((p: any) => {
															const code = p._roleCode as string
															const firstInitial = (p.first_name || '').trim().charAt(0)
															const displayName = `${firstInitial ? firstInitial.toUpperCase() + '.' : ''} ${p.last_name || ''}`.trim()
															const jersey = (playersById[p.id] as any)?.jersey_number
															const red = hasRedById.has(p.id)
															const yellow = hasYellowById.has(p.id)
																const entered = enteredOnFieldIds.has(p.id)
																const borderCls = red ? 'border-red-600' : yellow ? 'border-yellow-500' : entered ? 'border-neutral-700' : ''
															return (
															<div
																key={p.id}
																className={`px-2 py-1 rounded-lg border border-border/40 flex items-center gap-2 ${borderCls} ${eventMode ? 'cursor-pointer ring-1 ring-primary/40' : ''}`}
																onClick={() => { if (eventMode) handleAssignEvent(p.id) }}
															>
																<div className="w-1.5 h-1.5 rounded-full bg-green-500" />
																{code && code !== 'ALTRI' && (
																	<Badge variant="secondary" className="shrink-0 h-5 px-1 py-0 text-[11px] leading-none">{code}</Badge>
																)}
																{typeof jersey === 'number' && (
																	<span className="text-xs text-muted-foreground">#{jersey}</span>
																)}
																<div className="text-xs sm:text-sm leading-tight">{displayName}</div>
																{/* No per-player action icons here in new interaction model */}
																{renderEventBadges(p.id)}
															</div>
														)
													})}
												</div>
											)}
										</div>
									)
								})}
								{/* Nota dialog */}
								<Dialog open={noteOpen} onOpenChange={setNoteOpen}>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Nota</DialogTitle>
										</DialogHeader>
										<div className="space-y-3">
											<div>
												<Label className="text-sm">Testo</Label>
												<Textarea value={noteText} onChange={(e:any)=>setNoteText(e.target.value)} placeholder="Scrivi una nota..." rows={4} />
											</div>
											<div className="flex justify-end gap-2">
												<Button variant="outline" onClick={()=>{ setNoteOpen(false); setNoteText(''); setSelectedPlayerId(null); setEventMode(null) }}>Annulla</Button>
												<Button onClick={async()=>{ if (selectedPlayerId) { await postEvent({ event_type: 'note', player_id: selectedPlayerId, comment: noteText || null }); } setNoteOpen(false); setNoteText(''); setSelectedPlayerId(null); setEventMode(null) }}>Salva</Button>
											</div>
										</div>
									</DialogContent>
								</Dialog>

								<Dialog open={subOpen} onOpenChange={setSubOpen}>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Nuova sostituzione</DialogTitle>
										</DialogHeader>
										<div className="space-y-3">
											<div>
												<Label className="text-sm">Esce</Label>
												<Select value={subOutId} onValueChange={setSubOutId}>
													<SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
													<SelectContent>
														{Array.from(onFieldIds).map((id) => (
															<SelectItem key={id} value={id}>{getDisplayName(id)}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label className="text-sm">Entra</Label>
												<Select value={subInId} onValueChange={setSubInId}>
													<SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
													<SelectContent>
														{availableInIds.map((id) => (
															<SelectItem key={id} value={id}>{getDisplayName(id)}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="flex justify-end gap-2">
												<Button variant="outline" onClick={() => setSubOpen(false)}>Annulla</Button>
												<Button onClick={doSubstitution} disabled={!subOutId || !subInId}><Repeat className="h-4 w-4 mr-1" /> Conferma</Button>
											</div>
										</div>
									</DialogContent>
															</Dialog>
						</div>
						)}
					</div>
					<div className="rounded-xl border border-border/30 bg-white shadow-sm overflow-hidden">
							<div className="px-2 py-2 text-sm font-semibold flex items-center justify-between bg-amber-50 border-b border-amber-200">
								<div className="flex items-center gap-2 text-amber-800">
									<span className="material-symbols-outlined text-[18px]">event_seat</span>
									<span>Panchina</span>
								</div>
								<Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>setBenchCollapsed(prev=>!prev)} aria-label={benchCollapsed ? 'Apri panchina' : 'Chiudi panchina'}>
									<span className="material-symbols-outlined text-[16px]">{benchCollapsed ? 'expand_more' : 'expand_less'}</span>
								</Button>
							</div>
							{!benchCollapsed && (
								<div className="p-3 space-y-1.5 max-h-[200px] overflow-y-auto">
									{benchVisibleSorted.map((p: any) => {
										const wasSubbedOut = subOutIds.has(p.id)
										return (
											<div key={p.id} className={`flex items-center gap-2 p-1.5 rounded border text-xs ${wasSubbedOut ? 'bg-muted/40 border-border/20 text-foreground/70' : 'border-border/30'}`}>
												<div className={`w-1.5 h-1.5 rounded-full ${wasSubbedOut ? 'bg-neutral-400' : 'bg-emerald-500'}`} />
												<div className="truncate">{p.first_name} {p.last_name}</div>
												<Button aria-label="Sostituisci" variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={()=>{ if (isEnded || !hasValidLineup || wasSubbedOut) return; setSubInId(p.id); setSubOpen(true) }} disabled={isEnded || !hasValidLineup || wasSubbedOut}>
													<span className="material-symbols-outlined text-[18px]">compare_arrows</span>
												</Button>
											</div>
										)
									})}
									{benchVisibleSorted.length === 0 && (
										<div className="text-sm text-muted-foreground">Nessun giocatore in panchina.</div>
									)}
								</div>
							)}
						</div>
					</div>
					{/* Colonna centrale: toolbar + eventi */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
						{/* Eventi */}
						<div className="rounded-xl border border-border/30 bg-white shadow-sm overflow-hidden min-h-[180px]">
							<div className="px-3 py-2 text-sm font-medium text-neutral-800 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
								<div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">event</span><span>Eventi</span></div>
								<span className="text-[10px] uppercase tracking-wide text-neutral-500 bg-white/70 border border-neutral-200 rounded-full px-2 py-0.5">Squadra</span>
							</div>
							<div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
								<Button variant="ghost" size="sm" onClick={()=>toggleEventMode('goal')} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='goal' ? 'ring-2 ring-sky-300 border-sky-300 shadow-sm' : ''} bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100`} disabled={isEnded || !hasValidLineup}>
									<GoalIcon className="inline-block h-4 w-4" />Gol
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>setPenaltyOpenUs(true)} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='pen_scored' ? 'ring-2 ring-sky-300 border-sky-300 shadow-sm' : ''} bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100`} disabled={isEnded || !hasValidLineup}>
									<span className="material-symbols-outlined text-[18px]">sports_soccer</span>Rigore
								</Button>
								
								<Button variant="ghost" size="sm" onClick={()=>toggleEventMode('assist')} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='assist' ? 'ring-2 ring-sky-300 border-sky-300 shadow-sm' : ''} bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100`} disabled={isEnded || !hasValidLineup}>
									<AssistIcon className="inline-block h-4 w-4" />Assist
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>toggleEventMode('yellow_card')} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='yellow_card' ? 'ring-2 ring-yellow-300 border-yellow-300 shadow-sm' : ''} bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100`} disabled={isEnded || !hasValidLineup}>
									<YellowCardIcon className="inline-block h-3 w-3" />Ammonizione
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>toggleEventMode('red_card')} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='red_card' ? 'ring-2 ring-red-300 border-red-300 shadow-sm' : ''} bg-red-50 border-red-200 text-red-700 hover:bg-red-100`} disabled={isEnded || !hasValidLineup}>
									<RedCardIcon className="inline-block h-3 w-3" />Espulsione
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>toggleEventMode('foul')} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='foul' ? 'ring-2 ring-sky-300 border-sky-300 shadow-sm' : ''} bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100`} disabled={isEnded || !hasValidLineup}>
									<FoulIcon className="inline-block h-4 w-4" />Fallo
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>toggleEventMode('save')} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='save' ? 'ring-2 ring-sky-300 border-sky-300 shadow-sm' : ''} bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100`} disabled={isEnded || !hasValidLineup}>
									<ParataIcon className="inline-block h-4 w-4" />Parata
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>toggleEventMode('note')} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors ${eventMode==='note' ? 'ring-2 ring-sky-300 border-sky-300 shadow-sm' : ''} bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100`} disabled={isEnded || !hasValidLineup}>
									<span className="material-symbols-outlined text-[18px]">note_add</span>Nota
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>{ if (isEnded || !hasValidLineup) return; setSubInId(''); setSubOpen(true) }} className={`h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100`} disabled={isEnded || !hasValidLineup}>
									<span className="material-symbols-outlined text-[18px]">compare_arrows</span>Sostituzione
								</Button>
							</div>
						</div>

						{/* Eventi avversario */}
						<div className="rounded-xl border border-border/30 bg-white shadow-sm overflow-hidden min-h-[180px]">
							<div className="px-3 py-2 text-sm font-medium text-neutral-800 bg-destructive/10 border-b border-destructive/20 flex items-center justify-between">
								<div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">group</span><span>Eventi avversario</span></div>
								<span className="text-[10px] uppercase tracking-wide text-neutral-500 bg-white/70 border border-neutral-200 rounded-full px-2 py-0.5">Avv.</span>
							</div>
							<div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
								<Button variant="ghost" size="sm" onClick={()=>postEvent({ event_type: 'goal', team: 'opponent' })} className="h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100 ring-1 ring-rose-200/60 hover:ring-rose-300" disabled={isEnded || !hasValidLineup}>
									<GoalIcon className="inline-block h-4 w-4" />Gol
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>setPenaltyOpenOpp(true)} className="h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100 ring-1 ring-rose-200/60 hover:ring-rose-300" disabled={isEnded || !hasValidLineup}>
									<span className="material-symbols-outlined text-[18px]">sports_soccer</span>Rigore
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>postEvent({ event_type: 'save', team: 'opponent' })} className="h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100 ring-1 ring-rose-200/60 hover:ring-rose-300" disabled={isEnded || !hasValidLineup}>
									<ParataIcon className="inline-block h-4 w-4" />Parata
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>postEvent({ event_type: 'yellow_card', team: 'opponent' })} className="h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100" disabled={isEnded || !hasValidLineup}>
									<YellowCardIcon className="inline-block h-3 w-3" />Ammonizione
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>postEvent({ event_type: 'red_card', team: 'opponent' })} className="h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors bg-red-50 border-red-200 text-red-700 hover:bg-red-100" disabled={isEnded || !hasValidLineup}>
									<RedCardIcon className="inline-block h-3 w-3" />Espulsione
								</Button>
								<Button variant="ghost" size="sm" onClick={()=>postEvent({ event_type: 'foul', team: 'opponent' })} className="h-9 px-3 rounded-full border w-full justify-center flex items-center gap-2 transition-colors bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100 ring-1 ring-rose-200/60 hover:ring-rose-300" disabled={isEnded || !hasValidLineup}>
									<FoulIcon className="inline-block h-4 w-4" />Fallo
								</Button>
							</div>
						</div>

											{/* Cronaca */}
					<div className="rounded-xl border border-border/30 bg-white shadow-sm overflow-hidden md:col-span-2 relative">
						<div className="px-3 py-2 text-sm font-semibold text-foreground/90 bg-neutral-200 border-b border-neutral-300 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">list_alt</span>Cronaca</div>
						{cronacaCanUp && (
							<div className="absolute top-8 left-0 right-0 h-6 bg-gradient-to-b from-white/90 to-transparent flex items-center justify-center pointer-events-none">
								<span className="material-symbols-outlined text-[16px] text-neutral-400">expand_less</span>
							</div>
						)}
						{cronacaCanDown && (
							<div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/90 to-transparent flex items-center justify-center pointer-events-none">
								<span className="material-symbols-outlined text-[16px] text-neutral-400">expand_more</span>
							</div>
						)}
						<div ref={cronacaRef as any} className="p-3 space-y-1 max-h-[45vh] overflow-y-auto">
								{[...events].slice().reverse().map((e: any) => (
									<div key={e.id} className="text-sm text-muted-foreground flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-xs">[{e.minute ? `${e.minute}'` : new Date(e.created_at).toLocaleTimeString()}]</span>
											{e.event_type === 'goal' && <GoalIcon className="h-4 w-4" />}
											{e.event_type === 'assist' && <AssistIcon className="h-4 w-4" />}
											{e.event_type === 'yellow_card' && <YellowCardIcon className="h-3 w-3" />}
											{e.event_type === 'red_card' && <RedCardIcon className="h-3 w-3" />}
											{e.event_type === 'foul' && <FoulIcon className="h-4 w-4" />}
											{e.event_type === 'save' && <ParataIcon className="h-4 w-4" />}
											{e.event_type === 'note' && <StickyNote className="h-4 w-4" />}
											{e.event_type === 'substitution' && <span className="material-symbols-outlined text-[16px]">compare_arrows</span>}
											<span>{labelForEventType(e.event_type)}{e.event_type==='pen_scored' ? ' (segnato)' : e.event_type==='pen_missed' ? ' (sbagliato)' : ''}{e.team==='opponent' ? (' - ' + opponentName) : ''}</span>
											{e.event_type === 'pen_scored' && (
												<span className="ml-1 text-[10px] uppercase tracking-wide text-neutral-600 border border-neutral-300 rounded px-1">(rig.)</span>
											)}
											{(e.player_id || e.trialist_id) && <span className="font-medium">{getDisplayName(e.player_id || e.trialist_id)}</span>}
										</div>
										<Button variant="ghost" size="icon" onClick={async()=>{ await supabase.from('match_events').delete().eq('id', e.id); queryClient.invalidateQueries({ queryKey: ['match-events', id] })}} disabled={isEnded}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

			</div>
		</div>
	)
}

export default MatchLive

						
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Target, ArrowLeft, Play, Pause, Clock3, Plus, Shield, Redo2, StickyNote, Repeat, Trash2 } from 'lucide-react'
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

// Parata icon (SVG provided by user)
const PARATA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="16" height="16" viewBox="0 0 256 256" xml:space="preserve"><g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4110902877301328 1.4110902877301044) scale(2.82 2.82)"><path d="M 58.979 50.299 l 5.826 -5.826 c 1.283 -1.283 1.283 -3.381 0 -4.664 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l 5.978 -5.978 c 1.283 -1.283 1.283 -3.381 0 -4.664 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l 2.714 -2.714 c 1.283 -1.283 1.283 -3.381 0 -4.664 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -1.95 1.95 c 1.283 -1.283 1.283 -3.381 0 -4.664 s -3.381 -1.283 -4.664 0 l -9.785 9.785 l -6.238 6.238 l 1.088 -6.17 c 0.315 -1.786 -0.889 -3.506 -2.675 -3.821 l -0.444 -0.078 c -1.786 -0.315 -3.506 0.889 -3.821 2.675 l -2.679 15.192 c -0.462 2.197 -1.183 4.136 -2.216 5.761 l 14.078 14.078 C 45.323 61.404 54.842 54.436 58.979 50.299 L 58.979 50.299 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(87,89,93); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 28.362 50.899 l -2.241 -2.241 c 1.033 -1.625 1.754 -3.564 2.216 -5.761 l 2.679 -15.192 c 0.315 -1.786 2.034 -2.99 3.821 -2.675 l 0.444 0.078 C 33.451 37.047 33.013 45.818 28.362 50.899 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 36.867 35.098 l 6.238 -6.238 l 9.785 -9.785 c 1.283 -1.283 3.381 -1.283 4.664 0 L 39.2 37.43 L 36.867 35.098 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 43.841 42.071 l 20.305 -20.305 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -9.785 9.785 l -8.188 8.188 L 43.841 42.071 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 48.558 46.745 l 17.564 -17.564 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -9.785 9.785 l -5.447 5.447 L 48.558 46.745 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 53.225 51.361 L 64.79 39.796 c -1.283 -1.283 -3.381 -1.283 -4.664 0 l -9.233 9.233 L 53.225 51.361 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 32.625 68.706 L 19.986 56.067 c -1.253 -1.253 -1.253 -3.303 0 -4.556 l 2.216 -2.216 c 1.253 -1.253 3.303 -1.253 4.556 0 l 12.639 12.639 c 1.253 1.253 1.253 3.303 0 4.556 l -2.216 2.216 C 35.928 69.959 33.878 69.959 32.625 68.706 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 24.971 57.944 c -1.005 -1.005 -1.005 -2.649 0 -3.654 l 3.391 -3.391 l -2.055 -2.055 c -1.005 -1.005 -2.649 -1.005 -3.654 0 l -3.118 3.118 c -1.005 1.005 -1.005 2.649 0 3.654 l 13.541 13.541 c 0.911 0.911 2.344 0.987 3.353 0.245 L 24.971 57.944 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><rect x="44.55" y="39.62" rx="0" ry="0" width="1" height="16.5" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -20.6576 45.8728) "/><rect x="41.77" y="42.23" rx="0" ry="0" width="1" height="15.72" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7106 -0.7036 0.7036 0.7106 -23.0108 44.2408) "/><rect x="39.06" y="44.76" rx="0" ry="0" width="1" height="14.85" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7034 -0.7108 0.7108 0.7034 -25.3634 43.5968) "/><rect x="36.44" y="47.19" rx="0" ry="0" width="1" height="13.94" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -27.4777 41.9858) "/><rect x="-2.91" y="67.05" rx="0" ry="0" width="24.67" height="2" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -45.3568 26.5992) "/><rect x="2.44" y="72.39" rx="0" ry="0" width="24.67" height="2" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -47.57 31.9418) "/><rect x="7.78" y="77.74" rx="0" ry="0" width="24.67" height="2" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(0.7071 -0.7071 0.7071 0.7071 -49.7831 37.2844) "/><path d="M 82.813 7.756 c -3.871 -3.676 -9.067 -5.965 -14.8 -6.077 l 1.297 5.363 l 6.605 2.707 L 82.813 7.756 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><polygon points="80.41,31.74 82.55,24.6 76.19,18.91 68.8,21.11 66.36,28.34 70.5,33.08 " style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/><polygon points="67.38,20.64 63.01,14.77 53.69,16.7 52.12,22.28 58.3,29.43 64.94,27.89 " style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/><path d="M 84.001 8.966 l -6.975 2.016 v 6.683 l 6.793 6.066 l 5.876 -0.443 C 89.567 17.783 87.442 12.773 84.001 8.966 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.482 1.7 c -6.804 0.331 -12.803 3.727 -16.638 8.843 l 3.573 4.691 l 9.344 -1.942 l 5.067 -6.021 L 66.482 1.7 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.664 45.236 V 45.17 l -0.852 -5.039 l -7.584 -2.258 l -4.711 3.017 c 3.637 2.997 8.237 4.865 13.275 5.04 l -0.117 -0.694 H 66.664 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 36.584 v -5.828 l -6.498 -7.518 l -5.544 0.571 c 0 6.326 2.657 12.027 6.911 16.062 L 57.474 36.584 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 70.86 34.539 L 67.26 39.74 l 1.047 6.19 c 6.062 -0.198 11.506 -2.828 15.386 -6.953 l -3.188 -5.746 L 70.86 34.539 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(241,241,241); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.769 2.468 c -0.027 0.027 -0.055 0.054 -0.082 0.081 L 66.482 1.7 c -6.804 0.331 -12.803 3.727 -16.638 8.843 l 3.573 4.691 l 5.042 -1.048 c 1.681 -3.945 4.455 -7.849 8.309 -11.714 V 2.468 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 53.691 16.702 l -1.568 5.581 l 4.835 5.594 c -0.81 -4.051 -0.52 -8.062 0.862 -12.033 L 53.691 16.702 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.664 45.236 V 45.17 l -0.04 -0.234 c 0.013 0.014 0.026 0.028 0.04 0.042 v -0.016 c -1.864 -2.016 -3.491 -4.023 -4.841 -6.019 c 0 0 0 0 0 0 l -3.596 -1.07 l -4.711 3.017 c 3.637 2.997 8.237 4.865 13.275 5.04 l -0.117 -0.694 H 66.664 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 36.584 v -5.828 l -6.498 -7.518 l -5.544 0.571 c 0 6.326 2.657 12.027 6.911 16.062 L 57.474 36.584 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(219,219,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 30.756 v 5.828 l -5.132 3.287 c 0.375 0.356 0.758 0.702 1.157 1.031 l 4.729 -3.029 l 7.584 2.258 l 0.981 5.799 c 0.26 0.009 0.519 0.02 0.78 0.02 c 0.246 0 0.489 -0.011 0.734 -0.019 L 67.26 39.74 l 3.601 -5.201 l 9.644 -1.308 l 3.188 5.747 c 0.033 -0.036 0.068 -0.07 0.101 -0.106 c 0.112 -0.119 0.22 -0.241 0.329 -0.362 c 1.57 -1.766 2.864 -3.784 3.808 -5.988 c 0.043 -0.103 0.086 -0.205 0.127 -0.309 c 0.055 -0.133 0.106 -0.268 0.159 -0.403 c 0.945 -2.512 1.441 -5.271 1.49 -8.275 c -0.001 -0.083 -0.004 -0.165 -0.006 -0.248 l -5.882 0.443 l -6.793 -6.066 v -6.683 l 6.975 -2.016 c -0.379 -0.42 -0.778 -0.821 -1.188 -1.21 l -6.898 1.994 l -6.605 -2.707 l -1.297 -5.364 c -0.147 -0.003 -0.292 -0.011 -0.44 -0.011 c -0.366 0 -0.73 0.01 -1.092 0.028 l 1.348 5.576 l -5.067 6.021 l -9.344 1.942 l -3.573 -4.691 c -0.001 0.002 -0.003 0.003 -0.004 0.005 c -1.433 1.966 -2.495 4.002 -3.219 6.101 c -0.049 0.142 -0.099 0.284 -0.145 0.428 c -0.04 0.124 -0.076 0.248 -0.114 0.372 c -0.067 0.225 -0.132 0.451 -0.193 0.678 c -0.023 0.085 -0.045 0.17 -0.067 0.254 c -0.075 0.298 -0.145 0.597 -0.208 0.9 c -0.006 0.028 -0.013 0.056 -0.018 0.084 c -0.071 0.347 -0.133 0.698 -0.188 1.051 c -0.006 0.037 -0.01 0.074 -0.015 0.111 c -0.043 0.289 -0.079 0.581 -0.111 0.874 c -0.013 0.117 -0.023 0.234 -0.034 0.351 c -0.02 0.221 -0.037 0.443 -0.051 0.665 c -0.008 0.129 -0.017 0.258 -0.023 0.387 c -0.015 0.333 -0.025 0.667 -0.025 1.003 l 5.544 -0.571 L 57.474 30.756 z M 68.801 21.107 l 7.384 -2.192 l 6.363 5.683 l -2.136 7.14 l -9.907 1.343 l -4.144 -4.736 L 68.801 21.107 z M 53.691 16.702 l 9.314 -1.936 l 4.377 5.873 l -2.445 7.253 l -6.642 1.533 l -6.173 -7.142 L 53.691 16.702 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(87,89,93); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.687 2.549 c 0.292 -0.294 0.581 -0.588 0.886 -0.882 c -0.366 0 -0.73 0.01 -1.092 0.028 L 66.687 2.549 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 57.474 30.756 v 5.828 l -5.132 3.287 c 0.375 0.356 0.758 0.702 1.157 1.031 c 0 0 0 0 0 0 l 4.729 -3.029 l 3.596 1.07 c -2.516 -3.722 -4.135 -7.41 -4.865 -11.067 l -4.835 -5.594 l 1.568 -5.581 l 4.128 -0.858 c 0.193 -0.553 0.404 -1.106 0.639 -1.658 l -5.042 1.048 l -3.573 -4.691 c -0.001 0.002 -0.003 0.003 -0.004 0.005 c -1.433 1.966 -2.494 4.001 -3.219 6.101 c -0.023 0.069 -0.047 0.137 -0.07 0.206 c -0.025 0.074 -0.051 0.147 -0.075 0.222 c -0.04 0.124 -0.076 0.248 -0.114 0.372 c -0.066 0.22 -0.129 0.441 -0.188 0.664 c -0.001 0.005 -0.003 0.01 -0.004 0.015 c -0.023 0.085 -0.045 0.169 -0.067 0.254 c -0.075 0.298 -0.145 0.598 -0.208 0.9 c -0.006 0.028 -0.013 0.055 -0.018 0.083 c -0.071 0.347 -0.133 0.698 -0.188 1.051 c -0.006 0.036 -0.01 0.073 -0.015 0.109 c -0.041 0.274 -0.074 0.549 -0.105 0.826 c -0.002 0.016 -0.004 0.033 -0.006 0.049 c -0.013 0.117 -0.023 0.234 -0.034 0.351 c -0.018 0.196 -0.032 0.392 -0.045 0.589 c -0.002 0.025 -0.004 0.051 -0.006 0.076 c -0.008 0.129 -0.017 0.258 -0.023 0.387 c -0.015 0.333 -0.025 0.667 -0.025 1.003 l 5.544 -0.571 L 57.474 30.756 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/><path d="M 66.792 45.93 c 0.26 0.009 0.519 0.02 0.78 0.02 c -0.326 -0.338 -0.637 -0.676 -0.949 -1.014 L 66.792 45.93 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(63,64,66); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round"/></g></svg>`
const ParataIcon = ({ className = 'inline-block h-4 w-4' }: { className?: string }) => (
	<span className={className} dangerouslySetInnerHTML={{ __html: PARATA_SVG }} />
)

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
    ] },
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
    ] },
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
    ] }
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
  const flashRow = (pid: string) => {
    setFlashId(pid)
    setTimeout(() => setFlashId(null), 180)
  }
  const [eventMode, setEventMode] = useState<null | 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'foul' | 'save' | 'note'>(null)
  const toggleEventMode = (mode: NonNullable<typeof eventMode>) => {
    setEventMode(prev => prev === mode ? null : mode)
  }
  const handleAssignEvent = async (pid: string) => {
    if (!eventMode) return
    flashRow(pid)
    if (eventMode === 'note') {
      await postEvent({ event_type: 'note', player_id: pid, comment: `Nota su ${getDisplayName(pid)}` })
    } else {
      await postEvent({ event_type: eventMode, player_id: pid })
    }
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
      }
    })
    return stats
  }, [events])
  const renderEventBadges = (pid: string) => {
    const s = eventStatsById[pid]
    if (!s) return null
    return (
      <div className="ml-auto flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
        {s.goals > 0 && (<span className="inline-flex items-center gap-0.5"><Plus className="h-3 w-3" />{s.goals}</span>)}
        {s.assists > 0 && (<span className="inline-flex items-center gap-0.5"><Redo2 className="h-3 w-3" />{s.assists}</span>)}
        {s.yellows > 0 && (<span className="inline-flex items-center gap-0.5 text-yellow-600"><Shield className="h-3 w-3" />{s.yellows}</span>)}
        {s.reds > 0 && (<span className="inline-flex items-center gap-0.5 text-red-600"><Shield className="h-3 w-3" />{s.reds}</span>)}
        {s.saves > 0 && (<span className="inline-flex items-center gap-0.5 text-blue-600"><Shield className="h-3 w-3" />{s.saves}</span>)}
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

  // Substitution dialog
  const [subOpen, setSubOpen] = useState(false)
  const [subOutId, setSubOutId] = useState<string>('')
  const [subInId, setSubInId] = useState<string>('')
  const benchIds = useMemo(() => new Set(convocati.map((c: any) => c.id)), [convocati])
  const availableInIds = useMemo(() => Array.from(benchIds).filter((id: string) => !onFieldIds.has(id)), [benchIds, onFieldIds])
  const [benchRoleFilter, setBenchRoleFilter] = useState<'ALL'|'P'|'DIF'|'CEN'|'ATT'>('ALL')
  const filteredBench = useMemo(() => {
    return convocati
      .filter((p: any) => !onFieldIds.has(p.id))
      .filter((p: any) => {
        if (benchRoleFilter === 'ALL') return true
        const code = roleCodeForPlayerId(p.id)
        const sector = sectorFromCode(code)
        return sector === benchRoleFilter
      })
  }, [convocati, onFieldIds, benchRoleFilter, roleByCurrentOnFieldPlayerId, playersById])
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

  if (!id) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-2rem)]">
          {/* Colonna sinistra: In campo per blocchi ruolo */}
          <div className="flex flex-col overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />In campo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                            const borderCls = red ? 'border-red-600' : ''
                            return (
                              <div
                                key={p.id}
                                className={`px-2 py-1 rounded border flex items-center gap-2 ${borderCls} ${eventMode ? 'cursor-pointer ring-1 ring-primary/40' : ''}`}
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
              </CardContent>
            </Card>
          </div>

          {/* Colonna centrale: Scoreboard sticky + Panchina filtrabile */}
          <div className="flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10">
              <Card>
                <CardContent className="py-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/match/${id}`}><ArrowLeft className="h-4 w-4 mr-2" />Gestione</Link>
                      </Button>
                      <Badge variant="outline">{match?.opponent_name}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-center col-span-2 md:col-span-1">{score.us} - {score.opp}</div>
                    <div className="flex items-center justify-end gap-2">
                      <Select value={period} onValueChange={setPeriod as any}>
                        <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
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
                    <div className="col-span-2 md:col-span-3 flex items-center justify-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      <span className="tabular-nums">{String(Math.floor(seconds/60)).padStart(2, '0')}:{String(seconds%60).padStart(2, '0')}</span>
                      <Button variant="ghost" size="sm" onClick={toggleTimer} className="h-6 px-2">
                        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {/* Event toolbar under scoreboard (no substitution here) */}
                  <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                    <Button variant={eventMode==='goal'?'default':'outline'} size="sm" onClick={()=>toggleEventMode('goal')} className="h-8">
                      <span className="material-symbols-outlined text-[18px] mr-1">sports_soccer</span>
                      Gol
                    </Button>
                    <Button variant={eventMode==='assist'?'default':'outline'} size="sm" onClick={()=>toggleEventMode('assist')} className="h-8">
                      <span className="material-symbols-outlined text-[18px] mr-1">switch_access_shortcut_add</span>
                      Assist
                    </Button>
                    <Button variant={eventMode==='yellow_card'?'default':'outline'} size="sm" onClick={()=>toggleEventMode('yellow_card')} className="h-8">
                      <span className="material-symbols-outlined text-[18px] mr-1 text-yellow-500">crop_9_16</span>
                      Giallo
                    </Button>
                    <Button variant={eventMode==='red_card'?'default':'outline'} size="sm" onClick={()=>toggleEventMode('red_card')} className="h-8">
                      <span className="material-symbols-outlined text-[18px] mr-1 text-red-600">crop_9_16</span>
                      Rosso
                    </Button>
                    <Button variant={eventMode==='foul'?'default':'outline'} size="sm" onClick={()=>toggleEventMode('foul')} className="h-8">
                      <span className="material-symbols-outlined text-[18px] mr-1">shield_person</span>
                      Fallo
                    </Button>
                    <Button variant={eventMode==='save'?'default':'outline'} size="sm" onClick={()=>toggleEventMode('save')} className="h-8">
                      <ParataIcon className="inline-block h-4 w-4 mr-1" />
                      Parata
                    </Button>
                    <Button variant={eventMode==='note'?'default':'outline'} size="sm" onClick={()=>toggleEventMode('note')} className="h-8">
                      <span className="material-symbols-outlined text-[18px] mr-1">note_add</span>
                      Nota
                    </Button>
                  </div>
                  {eventMode && (
                    <div className="mt-1 text-center text-xs text-muted-foreground">
                      Seleziona un giocatore in campo per {eventMode === 'goal' ? 'registrare un gol' : eventMode === 'assist' ? 'registrare un assist' : eventMode === 'yellow_card' ? 'ammonire' : eventMode === 'red_card' ? 'espellere' : eventMode === 'foul' ? 'registrare un fallo' : eventMode === 'save' ? 'registrare una parata' : 'aggiungere una nota'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-3 flex-1 overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Panchina</span>
                  <div className="flex items-center gap-2">
                    <Select value={benchRoleFilter} onValueChange={(v:any)=>setBenchRoleFilter(v)}>
                      <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Ruolo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tutti</SelectItem>
                        <SelectItem value="P">Portiere</SelectItem>
                        <SelectItem value="DIF">Difesa</SelectItem>
                        <SelectItem value="CEN">Centrocampo</SelectItem>
                        <SelectItem value="ATT">Attacco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {filteredBench.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded border">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <div className="truncate">{p.first_name} {p.last_name}</div>
                      <Button aria-label="Sostituisci" variant="ghost" size="icon" className="ml-auto" onClick={()=>{ setSubInId(p.id); setSubOpen(true) }}>
                        <span className="material-symbols-outlined text-[18px]">transfer_within_a_station</span>
                      </Button>
                    </div>
                  ))}
                  {filteredBench.length === 0 && (
                    <div className="text-sm text-muted-foreground">Nessun giocatore in panchina per il filtro selezionato.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonna destra: Log eventi */}
          <div className="flex flex-col overflow-hidden">
            <Card className="flex-1 overflow-y-auto">
              <CardHeader>
                <CardTitle>Eventi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {[...events].slice().reverse().map((e: any) => (
                    <div key={e.id} className="text-sm text-muted-foreground flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">[{e.minute ? `${e.minute}'` : new Date(e.created_at).toLocaleTimeString()}]</span>
                        {e.event_type === 'save' ? (
                          <ParataIcon className="h-4 w-4" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">
                            {e.event_type === 'goal' ? 'sports_soccer' : e.event_type === 'assist' ? 'switch_access_shortcut_add' : e.event_type === 'yellow_card' ? 'crop_9_16' : e.event_type === 'red_card' ? 'crop_9_16' : e.event_type === 'foul' ? 'shield_person' : 'note_add'}
                          </span>
                        )}
                        <span>{e.event_type}</span>
                        {(e.player_id || e.trialist_id) && <span className="font-medium">{getDisplayName(e.player_id || e.trialist_id)}</span>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={async()=>{ await supabase.from('match_events').delete().eq('id', e.id); queryClient.invalidateQueries({ queryKey: ['match-events', id] })}}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchLive
<?php

/*
|--------------------------------------------------------------------------
| Identidad visual CAP (marca instalada) — copiar a config/design.php
|--------------------------------------------------------------------------
|
| Expone a PHP los mismos tokens que usa el frontend (resources/design/tokens.json):
| config('design.brand.red'), config('design.chrome.surface'), config('design.fonts.webfont')…
| Para blades de PDF, correos y cualquier color que salga del servidor. Nunca el hex a mano.
|
*/

return json_decode(file_get_contents(resource_path('design/tokens.json')), true, 512, JSON_THROW_ON_ERROR);

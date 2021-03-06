/**
 * Created with JetBrains WebStorm.
 * User: renga
 * Date: 2/11/13
 * Time: 11:48 AM
 * To change this template use File | Settings | File Templates.
 */
var itemConfigure ='                                                             \
{                                                                       \
        "items":[                                                       \                                                        \
                {                                                        \
               "name":"eraser",                                         \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.0,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/eraser.png",             \
               "center":{"cx":0.4,"cy":0.2 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                                          \
                              {"x":-0.01322, "y":-0.00463},          \
                              {"x":0.01322, "y":-0.00463},    \
                              {"x":0.01322, "y":0.00463 },     \
                              {"x":-0.01322, "y":0.00463}      \
                             ],                                         \
               "shape":    [                                            \
                            {"x":-0.0125, "y": 0},    \
                            {"x":-0.00875, "y":-0.00437},    \
                            {"x":0.0045, "y":-0.001875},     \
                            {"x": 0.011, "y":-0.001875},      \
                            {"x":0.0125,  "y":0},   \
                            {"x":0.011,  "y":0.001875},\
                            {"x":0.0045,  "y":0.002375},\
                            {"x":-0.00875,  "y":0.00437}\
                           ]                                            \
               },\
              {                                                        \
               "name":"liquidpaper",                                      \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.5,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/liquidpaper.png",       \
               "center":{"cx":0.1,"cy":0.1 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                                          \
                              {"x":-0.03836, "y":-0.01797 },   \
                              {"x": 0.03783, "y":-0.01797 },   \
                              {"x": 0.03783, "y":0.01799 },    \
                              {"x":-0.03836, "y":0.01799 }     \
                             ],                                         \
               "shape":    [                                            \
                            {"x":-0.03836, "y":-0.0105},      \
                            {"x":-0.01455, "y":-0.0171 },     \
                            {"x": 0.01190, "y":-0.01190 },      \
                            {"x": 0.03571, "y":0.01455},        \
                            {"x": 0.03571, "y": 0.01719 },  \
                            {"x": 0.00132, "y":0.01719  }\
                           ]                                            \
               },\
              {\
                "name":"pen",                                            \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.0,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/pen.png",             \
               "center":{"cx":0.1,"cy":0.2 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                \
                              {"x": -0.08837, "y": -0.00555} ,    \
                              {"x": 0.08493, "y": -0.00555 },   \
                              {"x": 0.08493, "y": 0.00740 },   \
                              {"x": -0.08837, "y": 0.00740}   \
\
                             ],                                         \
               "shape":    [                                            \
                            {"x":-0.08060, "y":0},      \
                            {"x":-0.04670, "y":-0.00562 },     \
                            {"x": 0.07487, "y":-0.00562 },      \
                            {"x": 0.08237, "y":-0.00187},       \
                            {"x": 0.08237, "y":0.000875},       \
                            {"x": 0.07487, "y":0.0056},        \
                            {"x":-0.04662, "y":0.005625} \
                           ]                                            \
               },\
                                                                     \                                                        \
               {                                                        \
               "name":"stapler",                                      \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.0,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/Stapler_clean.png",       \
               "center":{"cx":0.4,"cy":0.3 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                                          \
                              {"x":-0.01587, "y":-0.00661 },   \
                              {"x": 0.01587, "y":-0.00661 },   \
                             {"x": 0.01587, "y":0.00555 },    \
                              {"x":-0.01587, "y":0.00555 }     \
                             ],                                         \
               "shape":    [                                            \
                            {"x":-0.0141, "y":-0.0060},      \
                            {"x":-0.00114, "y":-0.00475 },     \
                            {"x": 0.00237, "y":-0.00375 },      \
                            {"x": 0.013625, "y":-0.0025},        \
                            {"x": 0.014605, "y": 0.004318 },  \
                            {"x": 0.00312, "y":0.00406  },\
                            {"x": -0.006731, "y":0.00508  },\
                            {"x": -0.01037, "y":0.00475  },\
                            {"x": -0.0141, "y":0.00533  }\
                           ]                                            \
               },\
			   {                                                        \
               "name":"sharpener",                                            \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.0,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/sharpener_clean.png",       \
               "center":{"cx":0.2,"cy":0.4 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                                          \
                              {"x":-0.01322, "y":-0.01746 },   \
                              {"x": 0.01322, "y":-0.01746 },   \
                              {"x": 0.01322, "y":0.01693  },    \
                              {"x":-0.01322, "y":0.01693  }     \
                             ],                                         \
               "shape":    [                                            \
                            {"x":-0.0095, "y":-0.0157 },      \
                            {"x": 0.00951, "y":-0.0157 },     \
                            {"x": 0.01200, "y":-0.00475 },     \
                            {"x": 0.01200, "y": -0.001 },     \
                            {"x": 0.00925, "y": 0.01375 },       \
                            {"x":-0.00925, "y": 0.01375  },        \
                            {"x":-0.012, "y": -0.001  },        \
                            {"x":-0.012, "y": -0.0075  },        \
                            {"x":-0.0105, "y":-0.0157 }      \
                           ]                                            \
               },   \
			    {                                                        \
               "name":"highlighter",                                      \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.0,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/hilighter.png",       \
               "center":{"cx":0.1,"cy":0.4 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                                          \
                              {"x":-0.02592, "y": -0.00661 },   \
                              {"x": -0.02592, "y": 0.00661 },   \
                              {"x": 0.02698 , "y":0.00661 },    \
                              {"x":0.02698, "y": -0.00661 }     \
                             ],                                         \
               "shape":    [                                            \
                            {"x":-0.0140,   "y":-0.00635},      \
                            {"x": 0.022987, "y":-0.00635 },     \
                            {"x": 0.0245,   "y":0.00482 },      \
                            {"x": 0.0245,   "y":0.00431},        \
                            {"x": 0.00229,  "y": 0.00635},  \
                            {"x":-0.02032,  "y": 0.00635 },\
                            {"x": -0.02095, "y":0.00254 },\
                            {"x":-0.02501,   "y":0.00254 },        \
                            {"x":-0.02349,  "y":-0.001524 }, \
                            {"x":-0.02095,  "y":-0.002032 } \
                           ]                                            \
               },\
			   {                                                        \
               "name":"pencil",                                         \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.0,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/pencil.png",             \
               "center":{"cx":0.3,"cy":0.1 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                                          \
                              {"x":-0.04233, "y": -0.00635 },   \
                              {"x":-0.04233 , "y":  0.00661},   \
                              {"x": 0.04233, "y": 0.00661 },    \
                              {"x":0.04233 , "y": -0.00635}     \
                             ],                                         \
               "shape":    [                                            \
                            {"x": -0.0275, "y": -0.00575 },     \
                            {"x": 0.0405, "y": -0.00575 },     \
                            {"x": 0.0405, "y": 0.00525},  \
                            {"x":-0.0275, "y": 0.00575},     \
                            {"x":-0.0400, "y": 0}     \
                           ]                                            \
               },\
			   {                                                        \
               "name":"gluestick",                                      \
               "inplay":true,                                           \
               "surfaceMu":1.0,                                         \
               "rotation" :0.0,                                         \
               "mass":1.0,                                              \
               "imagePath":"resources/img/item/glue_CROPPED.png",       \
               "center":{"cx":0.3,"cy":0.2 },                           \
               "velocity":{"vx":0.0,"vy":0.0},                          \
               "boundingBox":[                                          \
                              {"x":-0.00793, "y":-0.03968 },   \
                              {"x": 0.01058, "y":-0.03968 },   \
                              {"x": 0.01058, "y":0.03968 },    \
                              {"x":-0.00793, "y":0.03968 }     \
                             ],                                         \
               "shape":    [                                            \
                            {"x":-0.00793, "y":-0.03968},      \
                            {"x": 0.01058, "y":-0.03968 },     \
                            {"x": 0.01058, "y":0.03968 },      \
                            {"x":-0.00793, "y":0.03968}        \
                           ]                                            \
               }\
]                                                       \
}                                                                       \
';
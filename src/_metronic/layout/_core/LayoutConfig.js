import { toAbsoluteUrl } from "../../_helpers";
export function getInitLayoutConfig() {
  return {
    js: {
      breakpoints: {
        sm: "576",
        md: "768",
        lg: "992",
        xl: "1200",
        xxl: "1200",
      },
      colors: {
        theme: {
          base: {
            white: "#ffffff",
            primary: "#FF5629",
            secondary: "#E5EAEE", //
            success: "#1BC5BD",//
            info: "#3699FF",
            warning: "#F14336",
            danger: "#F64E60",//
            light: "#F3F6F9",//
            dark: "#212121", //
          },
        },
        gray: {
          gray100: "#F3F6F9", //
          gray200: "#ECF0F3", //
          gray300: "#E5EAEE", //
          gray400: "#D6D6E0", //
          gray500: "#9E9999",
          gray600: "#80808F", //
          gray700: "#464E5F", //
          gray800: "#000000",
          gray900: "#212121", //
        },
      },
      fontFamily: "Poppins",
    },
    // == Page Splash Screen loading
    loader: {
      enabled: true,
      type: "", // default|spinner-message|spinner-logo
      logo: toAbsoluteUrl("/media/logos/logo-dark.png"),
      message: "Please wait...",
    },
    // page toolbar
    toolbar: {
      display: true,
    },
    header: {
      self: {
        width: "fluid", // fixed|fluid
        theme: "light", // light|dark
        fixed: {
          desktop: true,
          mobile: true,
        },
      },
      menu: {
        self: {
          display: true,
          layout: "default", // tab/default
          "root-arrow": false,
          "icon-style": "duotone", // duotone, line, bold, solid
        },
        desktop: {
          arrow: true,
          toggle: "click",
          submenu: {
            theme: "light", // light|dark
            arrow: true,
          },
        },
        mobile: {
          submenu: {
            theme: "light",
            accordion: true,
          },
        },
      },
    },
    subheader: {
      display: true,
      displayDesc: false,
      displayDaterangepicker: true,
      layout: "subheader-v1",
      fixed: false,
      width: "fluid", // fixed/fluid,
      clear: true,
      style: "transparent", // solid/transparent
    },
    content: {
      width: "fixed", // fluid|fixed
    },
    brand: {
      self: {
        theme: "light", // light/dark
      },
    },
    aside: {
      self: {
        theme: "light", // light/dark
        display: true,
        fixed: true,
        minimize: {
          toggle: true, // allow toggle
          default: false, // default state
          hoverable: true, // allow hover
        },
      },
      footer: {
        self: {
          display: true,
        },
      },
      menu: {
        theme: "light",
        dropdown: false, // ok
        scroll: true, // ok
        "icon-style": "duotone", // duotone, line, bold, solid
        submenu: {
          accordion: true,
          dropdown: {
            arrow: true,
            "hover-timeout": 500, // in milliseconds
          },
        },
      },
    },
    footer: {
      self: {
        fixed: true,
        width: "fluid",
      },
    },
    extras: {
      search: {
        display: true,
        layout: "dropdown", // offcanvas, dropdown
        offcanvas: {
          direction: "right",
        },
      },
      notifications: {
        display: true,
        layout: "dropdown", // offcanvas, dropdown
        dropdown: {
          style: "light", // light, dark
        },
        offcanvas: {
          directions: "right",
        },
      },
      "quick-actions": {
        display: true,
        layout: "dropdown", // offcanvas, dropdown,
        dropdown: {
          style: "dark", // light, dark
        },
        offcanvas: {
          directions: "right",
        },
      },
      user: {
        display: true,
        layout: "dropdown", // offcanvas, dropdown
        dropdown: {
          style: "dark",
        },
        offcanvas: {
          directions: "right",
        },
      },
      languages: {
        display: true,
      },
      cart: {
        display: true,
        dropdown: {
          style: "dark", // ligth, dark
        },
      },
      "quick-panel": {
        display: true,
        offcanvas: {
          directions: "right",
        },
      },
      chat: {
        display: true,
      },
      toolbar: {
        display: true,
      },
      scrolltop: {
        display: true,
      },
    },
  };
}

/**
 * Flowbite CSS Class Reference for SELLY-AI SILPANA
 * 
 * Reference guide for Flowbite CSS classes to apply consistent styling
 * across SILPANA components following Flowbite Pro patterns.
 * 
 * Use these classes directly in your components with Tailwind CSS.
 * 
 * @see https://flowbite.com/docs/getting-started/introduction/
 */

/**
 * Flowbite CSS class reference object
 * Use these values as className strings in your components
 */
export const flowbiteTheme = {
  // Badge styling - used for status indicators, priority levels
  badge: {
    root: {
      color: {
        info: "bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-300",
        primary:
          "bg-blue-600 text-white dark:bg-blue-500 dark:text-white group-hover:bg-blue-700 dark:group-hover:bg-blue-600",
        success:
          "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-300",
        warning:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-300",
        failure:
          "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-300",
      },
      size: {
        xs: "px-2 py-0.5 text-xs",
        sm: "px-2.5 py-0.5 text-sm",
        md: "px-3 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
        xl: "px-4 py-2 text-base rounded-md",
      },
    },
    icon: {
      off: "rounded-full px-2 py-1",
    },
  },

  // Button styling - primary actions, form submissions
  button: {
    base: "group flex items-center justify-center text-center font-medium focus:z-10 transition-all duration-200",
    color: {
      primary:
        "text-white bg-blue-700 border border-transparent enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:enabled:hover:bg-blue-700 dark:focus:ring-blue-800",
      gray: "text-gray-900 bg-white border border-gray-300 enabled:hover:bg-gray-100 enabled:hover:text-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:enabled:hover:text-white dark:enabled:hover:bg-gray-600 dark:focus:ring-gray-700",
      info: "text-white bg-blue-700 border border-transparent enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:enabled:hover:bg-blue-700 dark:focus:ring-blue-800",
      success:
        "text-white bg-green-700 border border-transparent enabled:hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:enabled:hover:bg-green-700 dark:focus:ring-green-800",
      warning:
        "text-white bg-yellow-400 border border-transparent enabled:hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-900",
      failure:
        "text-white bg-red-700 border border-transparent enabled:hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:enabled:hover:bg-red-700 dark:focus:ring-red-900",
    },
    inner: {
      base: "flex items-center gap-2 transition-all duration-200",
    },
    outline: {
      color: {
        gray: "border border-gray-300 dark:border-gray-600",
      },
    },
    size: {
      xs: "text-xs px-2 py-1",
      sm: "text-sm px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-5 py-2.5",
      xl: "text-base px-6 py-3",
    },
  },

  // Card styling - main content containers
  card: {
    root: {
      base: "flex rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800",
      children: "flex h-full flex-col justify-center gap-4 p-6",
    },
  },

  // Dropdown menu styling
  dropdown: {
    floating: {
      base: "z-10 w-fit rounded-xl divide-y divide-gray-100 shadow-lg focus:outline-none",
      content: "rounded-xl py-1 text-sm text-gray-700 dark:text-gray-200",
      target: "w-fit dark:text-white",
    },
    content: "",
  },

  // Modal/Dialog styling
  modal: {
    root: {
      base: "fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
      show: {
        on: "flex bg-gray-900 bg-opacity-50 dark:bg-opacity-80",
        off: "hidden",
      },
    },
    content: {
      base: "relative h-full w-full p-4 md:h-auto",
      inner: "relative rounded-lg bg-white shadow-lg dark:bg-gray-800 flex flex-col max-h-[90vh]",
    },
    body: {
      base: "flex-1 overflow-auto p-6",
    },
    header: {
      base: "flex items-start justify-between rounded-t border-b border-gray-200 p-5 dark:border-gray-700",
      title: "text-xl font-semibold text-gray-900 dark:text-white",
    },
    footer: {
      base: "flex items-center space-x-2 rounded-b border-t border-gray-200 p-6 dark:border-gray-700",
    },
  },

  // Navbar styling - top navigation bar
  navbar: {
    root: {
      base: "fixed z-30 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700",
      inner: {
        base: "mx-auto flex flex-wrap items-center justify-between p-4",
      },
    },
    brand: {
      base: "flex items-center",
    },
  },

  // Sidebar styling - left navigation panel
  sidebar: {
    root: {
      base: "flex fixed top-0 left-0 z-20 flex-col flex-shrink-0 pt-16 h-full duration-75 border-r border-gray-200 lg:flex transition-width dark:border-gray-700",
      inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-white py-4 px-3 dark:bg-gray-800",
    },
    item: {
      base: "flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
      active: "bg-gray-100 dark:bg-gray-700",
      icon: {
        base: "h-6 w-6 flex-shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white",
        active: "text-gray-700 dark:text-gray-100",
      },
    },
    collapse: {
      button:
        "group flex w-full items-center rounded-lg p-2 text-base font-normal text-gray-900 transition duration-75 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
      icon: {
        base: "h-6 w-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white",
        open: {
          on: "text-gray-900 dark:text-white",
          off: "",
        },
      },
    },
  },

  // Table styling - data tables
  table: {
    root: {
      base: "w-full text-left text-sm text-gray-500 dark:text-gray-400",
      shadow: "absolute left-0 top-0 -z-10 h-full w-full rounded-lg bg-white drop-shadow-md dark:bg-black",
    },
    head: {
      base: "group/head text-xs uppercase text-gray-700 dark:text-gray-400",
      cell: {
        base: "bg-gray-50 px-6 py-3 group-first/head:first:rounded-tl-lg group-first/head:last:rounded-tr-lg dark:bg-gray-700",
      },
    },
    body: {
      base: "group/body",
      cell: {
        base: "px-6 py-4 group-first/body:group-first/row:first:rounded-tl-lg group-first/body:group-first/row:last:rounded-tr-lg group-last/body:group-last/row:first:rounded-bl-lg group-last/body:group-last/row:last:rounded-br-lg",
      },
    },
    row: {
      base: "group/row bg-white dark:border-gray-700 dark:bg-gray-800",
      hovered: "hover:bg-gray-50 dark:hover:bg-gray-600",
      striped: "odd:bg-white even:bg-gray-50 odd:dark:bg-gray-800 even:dark:bg-gray-700",
    },
  },

  // Text input styling
  textInput: {
    base: "flex",
    field: {
      base: "relative w-full",
      input: {
        base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
        sizes: {
          sm: "p-2 sm:text-xs",
          md: "p-2.5 text-sm",
          lg: "p-4 sm:text-base",
        },
        colors: {
          gray: "border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500",
          info: "border-blue-500 bg-blue-50 text-blue-900 placeholder-blue-700 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-400 dark:bg-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-500",
          failure: "border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500",
          warning: "border-yellow-500 bg-yellow-50 text-yellow-900 placeholder-yellow-700 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-400 dark:bg-yellow-100 dark:focus:border-yellow-500 dark:focus:ring-yellow-500",
          success: "border-green-500 bg-green-50 text-green-900 placeholder-green-700 focus:border-green-500 focus:ring-green-500 dark:border-green-400 dark:bg-green-100 dark:focus:border-green-500 dark:focus:ring-green-500",
        },
        withIcon: {
          on: "!pl-12",
          off: "",
        },
        withAddon: {
          on: "rounded-r-lg",
          off: "rounded-lg",
        },
      },
    },
  },

  // Textarea styling
  textarea: {
    base: "block w-full rounded-lg border text-sm disabled:cursor-not-allowed disabled:opacity-50",
    colors: {
      gray: "border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500",
      info: "border-blue-500 bg-blue-50 text-blue-900 placeholder-blue-700 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-400 dark:bg-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-500",
      failure: "border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500",
      warning: "border-yellow-500 bg-yellow-50 text-yellow-900 placeholder-yellow-700 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-400 dark:bg-yellow-100 dark:focus:border-yellow-500 dark:focus:ring-yellow-500",
      success: "border-green-500 bg-green-50 text-green-900 placeholder-green-700 focus:border-green-500 focus:ring-green-500 dark:border-green-400 dark:bg-green-100 dark:focus:border-green-500 dark:focus:ring-green-500",
    },
  },

  // Label styling
  label: {
    root: {
      base: "text-sm font-medium",
      disabled: "opacity-50",
      colors: {
        default: "text-gray-900 dark:text-white",
        info: "text-blue-500 dark:text-blue-600",
        failure: "text-red-700 dark:text-red-500",
        warning: "text-yellow-500 dark:text-yellow-600",
        success: "text-green-700 dark:text-green-500",
      },
    },
  },

  // Select dropdown styling
  select: {
    base: "flex",
    field: {
      base: "relative w-full",
      select: {
        base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
        colors: {
          gray: "border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500",
        },
      },
    },
  },

  // Tabs styling
  tabs: {
    base: "flex flex-col gap-2",
    tablist: {
      base: "flex text-center",
      styles: {
        default: "flex-wrap border-b border-gray-200 dark:border-gray-700",
        underline: "flex-wrap -mb-px border-b border-gray-200 dark:border-gray-700",
        pills: "flex-wrap space-x-2",
      },
      tabitem: {
        base: "flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500",
        styles: {
          default: {
            base: "rounded-t-lg",
            active: {
              on: "bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-500",
              off: "text-gray-500 hover:bg-gray-50 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300",
            },
          },
          underline: {
            base: "rounded-t-lg",
            active: {
              on: "active rounded-t-lg border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500",
              off: "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300",
            },
          },
          pills: {
            base: "",
            active: {
              on: "rounded-lg bg-blue-600 text-white",
              off: "rounded-lg hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white",
            },
          },
        },
      },
    },
    tabpanel: "py-3",
  },

  // Breadcrumb styling
  breadcrumb: {
    root: {
      base: "",
      list: "flex items-center",
    },
    item: {
      base: "group flex items-center",
      chevron: "mx-1 h-4 w-4 text-gray-400 group-first:hidden md:mx-2",
      href: {
        off: "flex items-center text-sm font-medium text-gray-500 dark:text-gray-400",
        on: "flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
      },
      icon: "mr-2 h-4 w-4",
    },
  },

  // Spinner/Loading styling
  spinner: {
    base: "inline animate-spin text-gray-200",
    color: {
      failure: "fill-red-600",
      gray: "fill-gray-600",
      info: "fill-blue-600",
      pink: "fill-pink-600",
      purple: "fill-purple-600",
      success: "fill-green-500",
      warning: "fill-yellow-400",
    },
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-10 w-10",
    },
  },

  // Toast/Alert styling
  toast: {
    root: {
      base: "flex w-full max-w-xs items-center rounded-lg bg-white p-4 text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400",
    },
    toggle: {
      base: "-mx-1.5 -my-1.5 ml-auto inline-flex h-8 w-8 rounded-lg bg-white p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white",
    },
  },

  // Toggle Switch styling
  toggleSwitch: {
    root: {
      base: "group relative flex items-center rounded-lg focus:outline-none",
    },
    toggle: {
      base: "after:rounded-full rounded-full border group-focus:ring-4 group-focus:ring-blue-500/25",
      checked: {
        on: "after:translate-x-full after:border-white",
        off: "border-gray-200 bg-gray-200 dark:border-gray-600 dark:bg-gray-700",
        color: {
          blue: "border-blue-700 bg-blue-700",
          green: "border-green-700 bg-green-700",
          red: "border-red-700 bg-red-700",
          yellow: "border-yellow-400 bg-yellow-400",
          purple: "border-purple-700 bg-purple-700",
        },
      },
    },
  },
};

export default flowbiteTheme;

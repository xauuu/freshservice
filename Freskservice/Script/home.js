function renderHome(lang) {
  $(document).ready(function () {
    const appContainer = jQuery("#sr-categories-list");
    const processContainer = jQuery("#list-items");
    var appList = [];
    var processList = [];
    const url = `https://trusisor.freshservice.com/api/v2/objects/27000052210/records?query=language%20%3A%20%27${lang}%27%20AND%20is_active%20%3A%20%271%27`;

    $("#sr-search").keyup(function (e) {
      const activeApp = $(document).width() > 768 ? appContainer.find("li.active").data("app") : jQuery("#sr-categories-list-mb").val();
      const keyword = e.target.value.toLowerCase();
      const filteredProcesses = processList.filter(function (item) {
        const processName = item.data.process_name.toLowerCase();
        const appCode = item.data.app_code;

        if (activeApp === "all") {
          return processName.includes(keyword);
        }

        return processName.includes(keyword) && appCode.includes(activeApp);
      });

      renderProcess(filteredProcesses);
    });
    jQuery.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      headers: authHeader,
      success: function (response) {
        appList = getUniqueAppInfo(response.records);
        processList = response.records;
        renderApp(appList);
        renderProcess(processList);
      }
    });
    function getUniqueAppInfo(jsonData) {
      const uniqueAppInfo = new Map();

      jsonData.forEach((record) => {
        const { app_code, app_name, app_image } = record.data;

        const key = `${app_code}-${app_name}`;
        if (app_image) {
          uniqueAppInfo.set(key, { app_code, app_name, app_image });
        } else if (!uniqueAppInfo.has(key)) {
          uniqueAppInfo.set(key, { app_code, app_name, app_image: "" });
        }
      });
      const result = Array.from(uniqueAppInfo.values());
      return result;
    }

    function renderApp(list) {
      const title = lang == "vi" ? "Tất cả các mục dịch vụ" : "All Service Items";
      let html = `<li data-app="all" data-title="${title}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <g clip-path="url(#clip0_9423_15846)">
                            <path
                                d="M3.75 23.25L12 17.25L20.25 23.25V3C20.25 2.40326 20.0129 1.83097 19.591 1.40901C19.169 0.987053 18.5967 0.75 18 0.75H6C5.40326 0.75 4.83097 0.987053 4.40901 1.40901C3.98705 1.83097 3.75 2.40326 3.75 3V23.25Z"
                                stroke="#9B51E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </g>
                        <defs>
                            <clipPath id="clip0_9423_15846">
                                <rect width="24" height="24" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                    ${title}
                </li>`;
      let option = `<option selected="" value="all">${title}</option>`;
      jQuery.map(list, function (item, index) {
        const { app_name, app_code, app_image } = item;
        html += `<li data-app="${app_code}" data-title="${app_name}" title="${app_name}">
                    ${app_image ? app_image : defaultImage}
                    ${app_name}
                </li>`;
        option += `<option value="${app_code}">${app_name}</option>`;
      });
      appContainer.html(html);
      jQuery("#sr-categories-list-mb").html(option);
      $("#sr-categories-list li").click(function (e) {
        e.preventDefault();
        const appCode = jQuery(this).data("app");
        const title = jQuery(this).data("title");
        jQuery("h3").html(title);
        jQuery(this).closest("ul").find("li").removeClass("active");
        jQuery(this).closest("li").addClass("active");
        if (appCode == "all") renderProcess(processList);
        else {
          const newPList = processList.filter((item) => item.data.app_code == appCode);
          renderProcess(newPList);
        }
      });
      $("#sr-categories-list-mb").change(function (e) {
        e.preventDefault();
        const appCode = e.target.value;
        if (appCode == "all") renderProcess(processList);
        else {
          const newPList = processList.filter((item) => item.data.app_code == appCode);
          renderProcess(newPList);
        }
      });
    }
    function renderProcess(list) {
      $("#pagination").pagination({
        dataSource: list,
        pageSize: 8,
        callback: function (data, pagination) {
          let html = "";
          $.each(data, function (index, item) {
            console.log(item);
            const { process_image, process_name, process_url, process_description } = item.data;
            html += `<a class="item" href="${process_url}" target="_blank">
                        <div class="image">
                            ${process_image ? process_image : defaultImage}
                        </div>
                        <div class="info">
                            <h4>${process_name}</h4>
                            <p class="max2">${process_description}</p>
                        </div>
                    </a>`;
          });
          processContainer.html(html);
        }
      });
    }
  });

  $(document).ready(function () {
    const categoryContainer = jQuery("#solution-categories-list");
    const articleContainer = jQuery("#list-articles");
    const url = "https://trusisor.freshservice.com/api/v2/solutions/categories";
    jQuery.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      headers: authHeader,
      success: function (response) {
        renderCategory(response.categories?.slice(1));
      }
    });
    function renderCategory(list) {
      let html = ``;
      let option = "";
      jQuery.map(list, function (item, index) {
        const { id, name } = item;
        if (index == 0) fetchArticle(id);
        html += `<li data-id=${id} class="flex-center ${index == 0 ? " active" : ""}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
                        <path d="M1.5 19.1654V0.832031H16.5V19.1654" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M1.5 17.5H16.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M1.5 9.16406H16.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M9.83594 6.66406V4.16406H4.83594V6.66406" stroke="currentColor" stroke-width="1.4"
                            stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M13.1641 15V12.5H8.16406V15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    ${name}
                </li>`;
        option += `<option selected="${index == 0 ? "true" : "false"}" value="${id}">${name}</option>`;
      });
      categoryContainer.html(html);
      jQuery("#solution-categories-mb").html(option);

      $("#solution-categories-list li").click(function (e) {
        e.preventDefault();
        const id = jQuery(this).data("id");
        jQuery(this).closest("ul").find("li").removeClass("active");
        jQuery(this).addClass("active");
        fetchArticle(id);
      });
      $("#solution-categories-mb").change(function (e) {
        e.preventDefault();
        const id = e.target.value;
        fetchArticle(id);
      });
    }
    function fetchArticle(category_id) {
      jQuery.ajax({
        type: "GET",
        url: `https://trusisor.freshservice.com/api/v2/solutions/folders?category_id=${category_id}`,
        dataType: "json",
        headers: authHeader,
        success: function (response) {
          renderArticle(response.folders);
        }
      });
    }

    function renderArticle(list) {
      let html = ``;
      jQuery.map(list, function (item, index) {
        const { id, name } = item;
        html += `<a href="/support/solutions/folders/${id}" class="item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <g clip-path="url(#clip0_9485_1515)">
                            <path d="M2 14.6667H13.3333L15.3333 6H4L2 14.6667Z" stroke="currentColor" stroke-width="1.4"
                                stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12.6641 3.33203H6.66406L5.33073 1.33203H0.664062V11.9987" stroke="currentColor" stroke-width="1.4"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </g>
                        <defs>
                            <clipPath id="clip0_9485_1515">
                                <rect width="16" height="16" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                    <p>${name}</p>
                    <svg class="icon-end" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
                        fill="currentColor">
                        <g clip-path="url(#clip0_9368_15935)">
                            <path d="M8 1.5V14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M1.5 8H14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </g>
                        <defs>
                            <clipPath id="clip0_9368_15935">
                                <rect width="16" height="16" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                </a>`;
      });
      articleContainer.html(html);
    }
  });
}
